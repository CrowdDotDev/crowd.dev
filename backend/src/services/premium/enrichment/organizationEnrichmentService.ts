import PDLJS from 'peopledatalabs'
import moment from 'moment'
import lodash from 'lodash'
import { LoggingBase } from '../../loggingBase'
import {
  EnrichmentParams,
  IEnrichableOrganization,
  IEnrichmentResponse,
  IOrganization,
  IOrganizations,
} from './types/organizationEnrichmentTypes'
import { IServiceOptions } from '../../IServiceOptions'
import { renameKeys } from '../../../utils/renameKeys'
import OrganizationRepository from '../../../database/repositories/organizationRepository'
import OrganizationCacheRepository from '../../../database/repositories/organizationCacheRepository'
import { ApiWebsocketMessage } from '../../../types/mq/apiWebsocketMessage'
import { createRedisClient } from '../../../utils/redis'
import RedisPubSubEmitter from '../../../utils/redis/pubSubEmitter'

export default class OrganizationEnrichmentService extends LoggingBase {
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
    super(options)
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

  public async enrichOrganizationsAndSignalDone(): Promise<IOrganizations> {
    const enrichedOrganizations: IOrganizations = []
    const enrichedCacheOrganizations: IOrganizations = []
    for (const instance of await OrganizationRepository.filterByPayingTenant<IEnrichableOrganization>(
      this.tenantId,
      this.maxOrganizationsLimit,
      this.options,
    )) {
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
    const orgs = await this.update(enrichedOrganizations, enrichedCacheOrganizations)
    await this.sendDoneSignal(orgs)
    return orgs
  }

  private async update(orgs: IOrganizations, cacheOrgs: IOrganizations): Promise<IOrganizations> {
    await OrganizationCacheRepository.bulkUpdate(cacheOrgs, this.options)
    return OrganizationRepository.bulkUpdate(orgs, [...this.fields], this.options)
  }

  private convertEnrichedDataToOrg(
    data: Awaited<IEnrichmentResponse>,
    instance: IEnrichableOrganization,
  ): IOrganization {
    let location = null
    data = renameKeys(data, {
      summary: 'description',
      employee_count_by_country: 'employeeCountByCountry',
      twitter_url: 'twitter',
      location: 'address',
    })
    if (data.address) {
      data.geoLocation = data.address.geo ?? null
      delete data.address.geo
      location = `${data.address.street_address} ${data.address.address_line_2} ${data.address.name}`
    }
    if (data.employee_count_by_country && !data.employee_count) {
      const employees = Object.values(data.employee_count_by_country).reduce(
        (acc, size) => acc + size,
        0,
      )
      Object.assign(data, { employees: employees || instance.employees })
    }
    return lodash.pick(
      { ...data, location, lastEnrichedAt: new Date() },
      this.selectFieldsForEnrichment(instance),
    )
  }

  private async sendDoneSignal(organizations: IOrganizations) {
    const redis = await createRedisClient(true)
    const organizationIds = organizations.map((org) => org.id)

    const apiPubSubEmitter = new RedisPubSubEmitter('api-pubsub', redis, (err) => {
      this.log.error({ err }, 'Error in api-ws emitter!')
    })
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
    }

    return ['id', 'cachId', ...this.fields]
  }
}
