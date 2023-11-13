import { LoggerBase } from '@crowd/logging'
import { getRedisClient, RedisPubSubEmitter } from '@crowd/redis'
import lodash from 'lodash'
import moment from 'moment'
import PDLJS from 'peopledatalabs'
import {
  ApiWebsocketMessage,
  IEnrichableOrganization,
  IOrganization,
  IOrganizationCache,
  PlatformType,
  SyncMode,
} from '@crowd/types'
import { REDIS_CONFIG } from '../../../conf'
import OrganizationRepository from '../../../database/repositories/organizationRepository'
import { renameKeys } from '../../../utils/renameKeys'
import { IServiceOptions } from '../../IServiceOptions'
import { EnrichmentParams, IEnrichmentResponse } from './types/organizationEnrichmentTypes'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import OrganizationService from '@/services/organizationService'
import SearchSyncService from '@/services/searchSyncService'

export default class OrganizationEnrichmentService extends LoggerBase {
  tenantId: string

  fields = new Set<string>(['lastEnrichedAt'])

  private readonly apiKey: string

  private readonly maxOrganizationsLimit: number

  options: IServiceOptions

  constructor({
    options,
    apiKey,
    limit,
    tenantId,
  }: {
    options: OrganizationEnrichmentService['options']
    apiKey: string
    tenantId: string
    limit: number
  }) {
    super(options.log)
    this.options = options
    this.apiKey = apiKey
    this.maxOrganizationsLimit = limit
    this.tenantId = tenantId
  }

  /**
   * Fetch enrichment data from PDL Company API
   * @param enrichmentInput - The object that contains organization enrichment attributes
   * @returns the PDL company response
   */
  async getEnrichment({ name, website, locality }: EnrichmentParams): Promise<any> {
    const PDLClient = new PDLJS({ apiKey: this.apiKey })
    let data: null | IEnrichmentResponse
    try {
      const payload: Partial<EnrichmentParams> = {}

      if (name) {
        payload.name = name
      }

      if (website) {
        payload.website = website
      }

      data = await PDLClient.company.enrichment(payload as EnrichmentParams)

      if (data.website === 'undefined.es') {
        return null
      }

      data.name = name
    } catch (error) {
      this.options.log.error({ name, website, locality }, 'PDL Data Unavalable', error)
      return null
    }
    return data
  }

  static shouldReenrich(org: IOrganization, lastEnriched = 6): boolean {
    return org.lastEnrichedAt && moment(org.lastEnrichedAt).diff(moment(), 'months') >= lastEnriched
  }

  public async enrichOrganizationsAndSignalDone(
    includeOrgsActiveLastYear: boolean = false,
    verbose: boolean = false,
  ): Promise<IOrganization[]> {
    const enrichmentPlatformPriority = [
      PlatformType.GITHUB,
      PlatformType.LINKEDIN,
      PlatformType.TWITTER,
    ]
    const enrichedOrganizations: IOrganization[] = []
    const enrichedCacheOrganizations: IOrganizationCache[] = []
    let count = 0

    const organizationFilterMethod = includeOrgsActiveLastYear
      ? OrganizationRepository.filterByActiveLastYear
      : OrganizationRepository.filterByPayingTenant

    for (const instance of await organizationFilterMethod(
      this.tenantId,
      this.maxOrganizationsLimit,
      this.options,
    )) {
      const identityPlatforms = Array.from(
        instance.identities.reduce((acc, i) => {
          acc.add(i.platform)
          return acc
        }, new Set<string>()),
      )

      if (instance.orgActivityCount > 0 && identityPlatforms.length > 0) {
        const platformToUseForEnrichment = enrichmentPlatformPriority.filter((p) =>
          identityPlatforms.includes(p),
        )[0]

        if (platformToUseForEnrichment || instance.website) {
          const identityForEnrichment = instance.identities.find(
            (i) => i.platform === platformToUseForEnrichment,
          )

          if (verbose) {
            count += 1
            this.log.info(
              `(${count}/${this.maxOrganizationsLimit}). Enriching ${instance.displayName}`,
            )
            this.log.debug(instance)
          }
          const data = await this.getEnrichment({
            website: instance.website,
            name: identityForEnrichment?.name,
          })
          if (data) {
            const org = this.convertEnrichedDataToOrg(data, instance)
            enrichedOrganizations.push({
              ...org,
              id: instance.id,
              tenantId: this.tenantId,
              identities: instance.identities,
            })
            enrichedCacheOrganizations.push({ ...org, name: identityForEnrichment?.name })
          } else {
            const lastEnrichedAt = new Date()
            enrichedOrganizations.push({
              ...instance,
              id: instance.id,
              tenantId: this.tenantId,
              lastEnrichedAt,
            })
          }
        }
      }
    }
    const orgs = await this.update(enrichedOrganizations)
    await this.sendDoneSignal(orgs)
    return orgs
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async update(orgs: IOrganization[]): Promise<IOrganization[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const searchSyncService = new SearchSyncService(this.options, SyncMode.ASYNCHRONOUS)

      let unmergedOrgs: IOrganization[] = []

      // check strong weak identities and move them if needed
      for (const org of orgs) {
        await OrganizationRepository.checkIdentities(org, this.options, org.id)

        // TODO:: also check for weak strong identities to not loose them later for merge suggestions

        for (const identity of org.identities) {
          await OrganizationRepository.addIdentity(org.id, identity, {
            ...this.options,
            transaction,
          })
        }

        delete org.identities

        // Check for an organization with the same website exists
        let existingOrg
        let orgService

        if (org.website) {
          existingOrg = await OrganizationRepository.findByDomain(org.website, this.options)
          orgService = new OrganizationService({ ...this.options, transaction })
        }

        if (existingOrg && existingOrg.id !== org.id) {
          await orgService.merge(existingOrg.id, org.id)
          unmergedOrgs.push({ ...org, id: existingOrg.id })
        } else {
          unmergedOrgs.push(org)
        }
      }

      // Check if two or more orgs in the umergedOrgs list have same website
      const duplicateOrgs = []
      const uniqueWebsites = new Set()

      for (const org of unmergedOrgs) {
        if (uniqueWebsites.has(org.website)) {
          duplicateOrgs.push(org)
        } else {
          uniqueWebsites.add(org.website)
        }
      }

      // Remove duplicate organizations from unmergedOrgs
      unmergedOrgs = unmergedOrgs.filter((org) => !duplicateOrgs.includes(org))

      this.log.info('Duplicate organizations found in enriched list:', duplicateOrgs)

      // TODO: Update cache
      // await OrganizationCacheRepository.bulkUpdate(cacheOrgs, this.options, true)
      const records = await OrganizationRepository.bulkUpdate(
        unmergedOrgs,
        [...this.fields],
        { ...this.options, transaction },
        true,
      )

      for (const org of records) {
        await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, org.id)
      }

      await SequelizeRepository.commitTransaction(transaction)

      return records
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      this.log.error({ error }, 'Error updating organizations while enriching!')
      throw error
    }
  }

  private static sanitize(data: any): any {
    if (data.address) {
      data.geoLocation = data.address.geo ?? null
      delete data.address.geo
      data.location = `${data.address.street_address ?? ''} ${data.address.address_line_2 ?? ''} ${
        data.address.name ?? ''
      }`
    }
    if (data.employeeCountByCountry && !data.employees) {
      const employees = Object.values(data.employeeCountByCountry).reduce(
        (acc, size) => (acc as any) + size,
        0,
      )
      Object.assign(data, { employees: employees || data.employees })
    }
    if (data.description) {
      let description = data.description[0].toUpperCase()
      for (let char of data.description.slice(1)) {
        if (description.length > 1 && description.slice(-2) === '. ') {
          char = char.toUpperCase()
        }
        description += char
      }
      data.description = description
    }
    if (data.inferredRevenue) {
      const revenueList = data.inferredRevenue
        .replaceAll('$', '')
        .split('-')
        .map((x) => {
          // billions --> millions conversion, if needed
          const multiple = x.endsWith('B') ? 1000 : 1
          const value = parseInt(x, 10) * multiple
          return value
        })

      data.revenueRange = {
        min: revenueList[0],
        max: revenueList[1],
      }
    }

    return data
  }

  private static enrichSocialNetworks(
    data: IEnrichableOrganization,
    socialNetworks: {
      profiles: IEnrichmentResponse['profiles']
      linkedin_id: IEnrichmentResponse['linkedin_id']
    },
  ): IEnrichableOrganization {
    const socials = socialNetworks.profiles.reduce((acc, social) => {
      const platform = social.split('.')[0]
      const handle = social.split('/').splice(-1)[0]
      if (
        Object.values(PlatformType).includes(platform as any) &&
        handle !== socialNetworks.linkedin_id
      ) {
        acc[platform] = {
          handle,
          [platform === PlatformType.TWITTER ? 'site' : 'url']: social,
        }
      }
      return acc
    }, {})
    return { ...data, ...socials }
  }

  private convertEnrichedDataToOrg(
    pdlData: Awaited<IEnrichmentResponse>,
    instance: IEnrichableOrganization,
  ): IOrganization {
    let data = <IEnrichableOrganization>renameKeys(pdlData, {
      summary: 'description',
      employee_count_by_country: 'employeeCountByCountry',
      employee_count: 'employees',
      location: 'address',
      tags: 'tags',
      ultimate_parent: 'ultimateParent',
      immediate_parent: 'immediateParent',
      affiliated_profiles: 'affiliatedProfiles',
      all_subsidiaries: 'allSubsidiaries',
      alternative_domains: 'alternativeDomains',
      alternative_names: 'alternativeNames',
      average_employee_tenure: 'averageEmployeeTenure',
      average_tenure_by_level: 'averageTenureByLevel',
      average_tenure_by_role: 'averageTenureByRole',
      direct_subsidiaries: 'directSubsidiaries',
      employee_churn_rate: 'employeeChurnRate',
      employee_count_by_month: 'employeeCountByMonth',
      employee_growth_rate: 'employeeGrowthRate',
      employee_count_by_month_by_level: 'employeeCountByMonthByLevel',
      employee_count_by_month_by_role: 'employeeCountByMonthByRole',
      gics_sector: 'gicsSector',
      gross_additions_by_month: 'grossAdditionsByMonth',
      gross_departures_by_month: 'grossDeparturesByMonth',
      inferred_revenue: 'inferredRevenue',
    })
    data = OrganizationEnrichmentService.sanitize(data)

    data = OrganizationEnrichmentService.enrichSocialNetworks(data, {
      profiles: pdlData.profiles,
      linkedin_id: pdlData.linkedin_id,
    })

    data.identities = instance.identities

    if (data.github && data.github.handle) {
      const identityExists = data.identities.find(
        (i) => i.platform === PlatformType.GITHUB && i.name === data.github.handle,
      )
      if (!identityExists) {
        data.identities.push({
          name: data.github.handle,
          platform: PlatformType.GITHUB,
          integrationId: null,
          url: data.github.url || `https://github.com/${data.github.handle}`,
        })
      }
    }

    if (data.twitter && data.twitter.handle) {
      const identityExists = data.identities.find(
        (i) => i.platform === PlatformType.TWITTER && i.name === data.twitter.handle,
      )
      if (!identityExists) {
        data.identities.push({
          name: data.twitter.handle,
          platform: PlatformType.TWITTER,
          integrationId: null,
          url: data.twitter.url || `https://twitter.com/${data.twitter.handle}`,
        })
      }
    }

    if (data.linkedin && data.linkedin.handle) {
      const identityExists = data.identities.find(
        (i) => i.platform === PlatformType.LINKEDIN && i.name === data.linkedin.handle,
      )
      if (!identityExists) {
        data.identities.push({
          name: data.linkedin.handle,
          platform: PlatformType.LINKEDIN,
          integrationId: null,
          url: data.linkedin.url || `https://linkedin.com/company/${data.linkedin.handle}`,
        })
      }
    }

    // Set displayName using the first identity or fallback to website
    if (!data.displayName) {
      const identity = data.identities[0]
      data.displayName = identity ? identity.name : data.website
    }

    return lodash.pick(
      { ...data, lastEnrichedAt: new Date() },
      this.selectFieldsForEnrichment(instance),
    )
  }

  private async sendDoneSignal(organizations: IOrganization[]) {
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const organizationIds = organizations.map((org) => org.id)

    const apiPubSubEmitter = new RedisPubSubEmitter(
      'api-pubsub',
      redis,
      (err) => {
        this.log.error({ err }, 'Error in api-ws emitter!')
      },
      this.log,
    )
    if (!organizations.length) {
      apiPubSubEmitter.emit(
        'user',
        new ApiWebsocketMessage(
          'organization-bulk-enrichment',
          JSON.stringify({
            tenantId: this.tenantId,
            success: false,
            organizationIds,
          }),
          undefined,
          this.tenantId,
        ),
      )
    }
    // Send success message if there were enrichedMembers
    else {
      apiPubSubEmitter.emit(
        'user',
        new ApiWebsocketMessage(
          'organization-bulk-enrichment',
          JSON.stringify({
            tenantId: this.tenantId,
            success: true,
            organizationIds,
          }),
          undefined,
          this.tenantId,
        ),
      )
    }
  }

  private selectFieldsForEnrichment(org: IEnrichableOrganization): string[] {
    if (!OrganizationEnrichmentService.shouldReenrich(org)) {
      for (const field of Object.keys(org)) {
        if (org[field] === null) {
          this.fields.add(field)
        }
      }
    } else {
      Object.keys(org).forEach((field) => this.fields.add(field))
    }

    return ['id', ...this.fields]
  }
}
