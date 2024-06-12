import { singleOrDefault } from '@crowd/common'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IOrganizationIdentity, OrganizationIdentityType } from '@crowd/types'
import {
  ENRICHMENT_PLATFORM_PRIORITY,
  IEnrichableOrganizationData,
  IOrganizationData,
} from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationsToEnrich(
    perPage: number,
    page: number,
  ): Promise<IEnrichableOrganizationData[]> {
    const conditions: string[] = [
      'o."deletedAt" is null',
      'o.website is not null',
      `(o."lastEnrichedAt" is null or o."lastEnrichedAt" < now() - interval '3 months')`,
      ENRICHMENT_PLATFORM_PRIORITY.map((p) => `(o.${p} -> 'handle') is not null`).join(' or '),
      'ad."activityCount" >= 3',
    ]

    const query = `
    with activity_data as (select "organizationId",
                                  count(id)      as "activityCount",
                                  max(timestamp) as "lastActive"
                          from activities
                          where "deletedAt" is null
                          group by "organizationId")
    select o.id as "organizationId", 
           o."tenantId"
    from organizations o
            inner join activity_data ad on ad."organizationId" = o.id
    where ${conditions.join(' and ')}
    order by ad."activityCount" desc
    limit ${perPage} offset ${(page - 1) * perPage};
    `

    const results = await this.db().any(query)
    return results
  }

  public async getOrganizationData(organizationId: string): Promise<IOrganizationData | null> {
    return await this.db().oneOrNone(
      `
      with identities as (select oi."organizationId",
                                json_agg(json_build_object(
                                        'platform', oi.platform,
                                        'value', oi.value,
                                        'type', oi.type,
                                        'verified', oi.verified
                                          )) as "identities"
                          from "organizationIdentities" oi
                          where oi."organizationId" = $(organizationId)
                          group by oi."organizationId")
      select o.id,
            o.description,
            o.names,
            o.emails,
            o."phoneNumbers",
            o.logo,
            o.tags,
            o.employees,
            o."revenueRange",
            o."tenantId",
            o.location,
            o."employeeCountByCountry",
            o.type,
            o."geoLocation",
            o.size,
            o.ticker,
            o.headline,
            o.profiles,
            o.naics,
            o.address,
            o.industry,
            o.founded,
            o."displayName",
            o."allSubsidiaries",
            o."alternativeNames",
            o."averageEmployeeTenure",
            o."averageTenureByLevel",
            o."averageTenureByRole",
            o."directSubsidiaries",
            o."employeeChurnRate",
            o."employeeCountByMonth",
            o."employeeGrowthRate",
            o."employeeCountByMonthByLevel",
            o."employeeCountByMonthByRole",
            o."gicsSector",
            o."grossAdditionsByMonth",
            o."grossDeparturesByMonth",
            o."ultimateParent",
            o."immediateParent",
            o."manuallyChangedFields",
            coalesce(i.identities, json_build_array()) as identities
      from organizations o
              left join identities i on o.id = i."organizationId"
      where o.id = $(organizationId) and o."deletedAt" is null;
      `,
      {
        organizationId,
      },
    )
  }

  public async markOrganizationEnriched(organizationId: string): Promise<void> {
    await this.db().none(
      `
      update organizations
      set "lastEnrichedAt" = now()
      where id = $(organizationId)
      `,
      {
        organizationId,
      },
    )
  }

  public async updateIdentities(
    organizationId: string,
    tenantId: string,
    existingIdentities: IOrganizationIdentity[],
    newIdentities: IOrganizationIdentity[],
  ): Promise<void> {
    // check which identities are new or updated
    // according to the unique key one tenant can have only one identity per platform
    const toCreate: IOrganizationIdentity[] = []
    const toUpdate: IOrganizationIdentity[] = []

    for (const newIdentity of newIdentities) {
      const existingIdentity = singleOrDefault(
        existingIdentities,
        (i) =>
          i.platform === newIdentity.platform &&
          i.value === newIdentity.value &&
          i.type === newIdentity.type,
      )

      if (existingIdentity) {
        // we need to update verified if it's not the same
        if (existingIdentity.verified !== newIdentity.verified) {
          toUpdate.push(newIdentity)
        }
      } else {
        toCreate.push(newIdentity)
      }
    }

    const queries: string[] = []

    if (toUpdate.length > 0) {
      // generate bulk update query
      const entries = toUpdate.map((i) => {
        return {
          value: i.value,
          type: i.type,
          verified: i.verified,
          platform: i.platform,
          organizationId,
          tenantId,
        }
      })

      const query =
        this.dbInstance.helpers.update(
          entries,
          ['?organizationId', '?tenantId', '?platform', '?value', '?type', 'verified'],
          'organizationIdentities',
        ) +
        ' where t."organizationId" = v."organizationId"::uuid and t.platform = v.platform and t.value = v.value and t.type = v.type and t."tenantId" = v."tenantId"::uuid'

      queries.push(query)
    }

    if (toCreate.length > 0) {
      // generate bulk insert query
      const entries = toCreate.map((i) => {
        return {
          value: i.value,
          type: i.type,
          verified: i.verified,
          platform: i.platform,
          organizationId,
          tenantId,
        }
      })

      const query =
        this.dbInstance.helpers.insert(
          entries,
          ['organizationId', 'tenantId', 'platform', 'value', 'type', 'verified'],
          'organizationIdentities',
        ) + ` on conflict do nothing`

      queries.push(query)
    }

    if (queries.length > 0) {
      await Promise.all(queries.map((q) => this.db().none(q)))
    }
  }

  public async findIdentities(
    tenantId: string,
    organizationId: string,
    identities: IOrganizationIdentity[],
  ): Promise<IOrganizationIdentity[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      tenantId,
      organizationId,
    }

    const identityParams = identities
      .map(
        (identity) =>
          `(${this.dbInstance.as.text(identity.platform)}, ${this.dbInstance.as.text(
            identity.value,
          )}, ${this.dbInstance.as.text(identity.type)}, ${this.dbInstance.as.bool(
            identity.verified,
          )})`,
      )
      .join(', ')

    const results = await this.db().any(
      `
      with input_identities (platform, value, type, verified) as (
        values ${identityParams}
      )
      select oi.platform, oi.value, oi.type, oi.verified
      from "organizationIdentities" oi
        inner join input_identities i on oi.platform = i.platform and oi.value = i.value and oi.type = i.type and oi.verified = i.verified
      where oi."tenantId" = $(tenantId) and oi."organizationId" <> $(organizationId)
`,
      params,
    )

    return results
  }

  private static readonly ENRICHABLE_ORGANIZATION_FIELDS = [
    'description',
    'names',
    'emails',
    'phoneNumbers',
    'logo',
    'tags',
    'employees',
    'revenueRange',
    'location',
    'employeeCountByCountry',
    'type',
    'geoLocation',
    'size',
    'ticker',
    'headline',
    'profiles',
    'naics',
    'address',
    'industry',
    'founded',
    'allSubsidiaries',
    'alternativeNames',
    'averageEmployeeTenure',
    'averageTenureByLevel',
    'averageTenureByRole',
    'directSubsidiaries',
    'employeeChurnRate',
    'employeeCountByMonth',
    'employeeGrowthRate',
    'employeeCountByMonthByLevel',
    'employeeCountByMonthByRole',
    'gicsSector',
    'grossAdditionsByMonth',
    'grossDeparturesByMonth',
    'ultimateParent',
    'immediateParent',
  ]

  public async updateOrganizationWithEnrichedData(
    originalData: IOrganizationData,
    enrichedData: any,
  ): Promise<void> {
    const manuallyChangedFields = originalData.manuallyChangedFields || []

    const toUpdate: Record<string, unknown> = {}

    if (
      originalData.displayName === null ||
      (originalData.displayName.trim() === '' && enrichedData.displayName)
    ) {
      toUpdate.displayName = enrichedData.displayName
    }

    for (const field of OrganizationRepository.ENRICHABLE_ORGANIZATION_FIELDS) {
      if (manuallyChangedFields.includes(field)) {
        continue
      }

      if (field in enrichedData) {
        const enrichedValue = enrichedData[field]

        // ignore null/undefined/empty string values/empty arrays
        if (
          enrichedValue === null ||
          enrichedValue === undefined ||
          (typeof enrichedValue === 'string' && enrichedValue.trim() === '') ||
          (Array.isArray(enrichedValue) && enrichedValue.length === 0)
        ) {
          continue
        }

        const existingValue = originalData[field]

        if (typeof enrichedValue === 'object') {
          // compare stringified objects
          if (JSON.stringify(enrichedValue) === JSON.stringify(existingValue)) {
            continue
          }
        } else if (enrichedValue === existingValue) {
          continue
        }

        toUpdate[field] = enrichedValue
      }
    }

    const keysToUpdate = Object.keys(toUpdate)
    if (keysToUpdate.length > 0) {
      this.log.debug(
        { organizationId: originalData.id },
        `Updating organization with enriched data! With ${keysToUpdate.length} fields`,
      )

      if (toUpdate.naics) {
        toUpdate.naics = JSON.stringify(toUpdate.naics)
      }

      // set lastEnrichedAt to now
      keysToUpdate.push('lastEnrichedAt')
      toUpdate.lastEnrichedAt = new Date()

      const query = this.dbInstance.helpers.update(toUpdate, keysToUpdate, 'organizations')

      const result = await this.db().result(`${query} where id = $(id)`, {
        ...toUpdate,
        id: originalData.id,
      })

      this.checkUpdateRowCount(result.rowCount, 1)
    } else {
      await this.markOrganizationEnriched(originalData.id)
    }
  }

  public async anyOtherOrganizationWithTheSameWebsite(
    organizationId: string,
    tenantId: string,
    website: string,
  ): Promise<boolean> {
    const res = await this.db().oneOrNone(
      `
      select 1 from "organizationIdentities" 
      where
        "tenantId" = $(tenantId) and
        "organizationId" <> $(organizationId) and
        type = $(type) and
        value = $(value) and
        verified = true
      limit 1
      `,
      {
        tenantId,
        organizationId,
        type: OrganizationIdentityType.PRIMARY_DOMAIN,
        value: website,
      },
    )

    if (res) {
      return true
    }

    return false
  }
}
