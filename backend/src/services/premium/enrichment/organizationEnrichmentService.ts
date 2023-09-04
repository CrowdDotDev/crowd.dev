import { LoggerBase } from '@crowd/logging'
import { getRedisClient, RedisPubSubEmitter } from '@crowd/redis'
import lodash from 'lodash'
import moment from 'moment'
import PDLJS from 'peopledatalabs'
import { ApiWebsocketMessage, PlatformType } from '@crowd/types'
import { REDIS_CONFIG } from '../../../conf'
import OrganizationRepository from '../../../database/repositories/organizationRepository'
import { renameKeys } from '../../../utils/renameKeys'
import { IServiceOptions } from '../../IServiceOptions'
import {
  EnrichmentParams,
  IEnrichableOrganization,
  IEnrichmentResponse,
  IOrganization,
  IOrganizations,
} from './types/organizationEnrichmentTypes'
import { getSearchSyncWorkerEmitter } from '@/serverless/utils/serviceSQS'

export default class OrganizationEnrichmentService extends LoggerBase {
  tenantId: string

  fields = new Set<string>(['name', 'lastEnrichedAt'])

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
      data = await PDLClient.company.enrichment({ name, website, locality })
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

  public async enrichOrganizationsAndSignalDone(verbose: boolean = false): Promise<IOrganizations> {
    const enrichedOrganizations: IOrganizations = []
    const enrichedCacheOrganizations: IOrganizations = []
    let count = 0
    for (const instance of await OrganizationRepository.filterByPayingTenant<IEnrichableOrganization>(
      this.tenantId,
      this.maxOrganizationsLimit,
      this.options,
    )) {
      if (instance.orgActivityCount > 0) {
        if (verbose) {
          count += 1
          this.log.info(`(${count}/${this.maxOrganizationsLimit}). Enriching ${instance.name}`)
        }
        const data = await this.getEnrichment(instance)
        if (data) {
          const org = this.convertEnrichedDataToOrg(data, instance)
          enrichedOrganizations.push({ ...org, id: instance.id, tenantId: this.tenantId })
          enrichedCacheOrganizations.push({ ...org, id: instance.cachId })
        } else {
          const lastEnrichedAt = new Date()
          enrichedOrganizations.push({
            ...instance,
            id: instance.id,
            tenantId: this.tenantId,
            lastEnrichedAt,
          })
          enrichedCacheOrganizations.push({ ...instance, id: instance.cachId, lastEnrichedAt })
        }
      }
    }
    const orgs = await this.update(enrichedOrganizations)
    await this.sendDoneSignal(orgs)
    return orgs
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async update(orgs: IOrganizations): Promise<IOrganizations> {
    const searchSyncEmitter = await getSearchSyncWorkerEmitter()

    // TODO: Update cache
    // await OrganizationCacheRepository.bulkUpdate(cacheOrgs, this.options, true)
    const records = await OrganizationRepository.bulkUpdate(
      orgs,
      [...this.fields],
      this.options,
      true,
    )

    for (const org of records) {
      // trigger open search sync
      await searchSyncEmitter.triggerOrganizationSync(this.options.currentTenant.id, org.id)
    }

    return records
  }

  private static sanitize(data: IEnrichableOrganization): IEnrichableOrganization {
    if (data.address) {
      data.geoLocation = data.address.geo ?? null
      delete data.address.geo
      data.location = `${data.address.street_address ?? ''} ${data.address.address_line_2 ?? ''} ${
        data.address.name ?? ''
      }`
    }
    if (data.employeeCountByCountry && !data.employees) {
      const employees = Object.values(data.employeeCountByCountry).reduce(
        (acc, size) => acc + size,
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

    return lodash.pick(
      { ...data, lastEnrichedAt: new Date() },
      this.selectFieldsForEnrichment(instance),
    )
  }

  private async sendDoneSignal(organizations: IOrganizations) {
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

    return ['id', 'cachId', ...this.fields]
  }
}
