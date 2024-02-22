import { EDITION, singleOrDefault } from '@crowd/common'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { Edition, TenantPlans } from '@crowd/types'
import {
  ENRICHMENT_PLATFORM_PRIORITY,
  IEnrichableOrganizationCache,
  IOrganizationCacheData,
  IOrganizationData,
  IOrganizationIdentity,
  IPremiumTenantInfo,
} from '../types/common'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  async getPremiumTenants(): Promise<IPremiumTenantInfo[]> {
    return await this.db().any(
      `
      select  t.id,
              t.plan,
              json_agg(
                      json_build_object(
                              'lastEnrichedAt', oc."lastEnrichedAt",
                              'organizationCacheId', oc.id,
                              'organizationId', sub."organizationId"
                      )
              )                           as "orgData"
        from tenants t
                inner join (select o."tenantId",
                                    o.id                                                                            as "organizationId",
                                    ocl."organizationCacheId",
                                    row_number() over (partition by o."tenantId" order by oc."lastEnrichedAt" desc) as rn
                            from organizations o
                                      inner join "organizationCacheLinks" ocl on ocl."organizationId" = o.id
                                      inner join "organizationCaches" oc on ocl."organizationCacheId" = oc.id
                            where o."deletedAt" is null
                              and oc."deletedAt" is null
                              and oc."lastEnrichedAt" is not null
                              and (o."lastEnrichedAt" is null or o."lastEnrichedAt" < oc."lastEnrichedAt")) sub
                            on sub."tenantId" = t.id and sub.rn <= 100
                inner join "organizationCaches" oc on sub."organizationCacheId" = oc.id
        where t.plan in ($(plans:csv))
        group by t.id, t.plan;
      `,
      {
        plans: [TenantPlans.Enterprise, TenantPlans.Growth, TenantPlans.Scale],
      },
    )
  }

  public async getOrganizationCachesToEnrich(
    perPage: number,
    page: number,
  ): Promise<IEnrichableOrganizationCache[]> {
    const conditions: string[] = [
      `(oc."lastEnrichedAt" is null or oc."lastEnrichedAt" < now() - interval '3 months')`,
      ENRICHMENT_PLATFORM_PRIORITY.map((p) => `(oc.${p} -> 'handle') is not null`).join(' or '),
    ]

    if (EDITION === Edition.LFX) {
      conditions.push('ad."activityCount" >= 3')
    } else {
      conditions.push(`ad."lastActive" > now() - interval '1 year'`)

      // this is guaranteed for now by the inner join just leaving it here for future reference
      // conditions.push(`ad."activityCount" >= 1`)
    }

    const query = `
    with activity_data as (select "organizationId",
                                  count(id)      as "activityCount",
                                  max(timestamp) as "lastActive"
                          from activities
                          where "deletedAt" is null
                          group by "organizationId")
    select oc.id, json_agg(json_build_object('id', t.id, 'plan', t.plan, 'name', t.name)) as tenants
    from "organizationCaches" oc
            inner join "organizationCacheLinks" ocl on oc.id = ocl."organizationCacheId"
            inner join organizations o on ocl."organizationId" = o.id and o."deletedAt" is null
            inner join activity_data ad on ad."organizationId" = o.id and ad."activityCount" >= 3
            inner join tenants t on t.id = o."tenantId" and t.plan in ($(plans:csv))
    where ${conditions.join(' and ')}
    group by oc.id, ad."activityCount"
    order by ad."activityCount" desc
    limit ${perPage} offset ${(page - 1) * perPage};
    `

    const results = await this.db().any(query, {
      plans: [TenantPlans.Enterprise, TenantPlans.Growth, TenantPlans.Scale],
    })
    return results
  }

  public async getOrganizationCacheData(cacheId: string): Promise<IOrganizationCacheData | null> {
    return await this.db().oneOrNone(
      `
    with identities as (select  oi.id,
                                json_agg(json_build_object(
                                        'name', oi.name,
                                        'website', oi.website
                                          )) as identities
                          from "organizationCacheIdentities" oi
                          where oi.id = $(cacheId)
                          group by oi.id)
      select oc.id,
            oc.description,
            oc.emails,
            oc."phoneNumbers",
            oc.logo,
            oc.tags,
            oc.twitter,
            oc.linkedin,
            oc.crunchbase,
            oc.employees,
            oc."revenueRange",
            oc.location,
            oc.github,
            oc."employeeCountByCountry",
            oc.type,
            oc."geoLocation",
            oc.size,
            oc.ticker,
            oc.headline,
            oc.profiles,
            oc.naics,
            oc.address,
            oc.industry,
            oc."affiliatedProfiles",
            oc."allSubsidiaries",
            oc."alternativeDomains",
            oc."alternativeNames",
            oc."averageEmployeeTenure",
            oc."averageTenureByLevel",
            oc."averageTenureByRole",
            oc."directSubsidiaries",
            oc."employeeChurnRate",
            oc."employeeCountByMonth",
            oc."employeeGrowthRate",
            oc."employeeCountByMonthByLevel",
            oc."employeeCountByMonthByRole",
            oc."ultimateParent",
            oc."immediateParent",
            i.identities
      from "organizationCaches" oc
              inner join identities i on oc.id = i.id
      where oc.id = $(cacheId)
        and oc."deletedAt" is null;
    `,
      {
        cacheId,
      },
    )
  }

  public async getOrganizationData(organizationId: string): Promise<IOrganizationData | null> {
    return await this.db().oneOrNone(
      `
      with identities as (select oi."organizationId",
                                json_agg(json_build_object(
                                        'platform', oi.platform,
                                        'name', oi.name,
                                        'url', oi.url
                                          )) as "identities"
                          from "organizationIdentities" oi
                          where oi."organizationId" = $(organizationId)
                          group by oi."organizationId")
      select o.id,
            o.description,
            o.emails,
            o."phoneNumbers",
            o.logo,
            o.tags,
            o.twitter,
            o.linkedin,
            o.crunchbase,
            o.employees,
            o."revenueRange",
            o."tenantId",
            o.location,
            o.github,
            o.website,
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
            o."affiliatedProfiles",
            o."allSubsidiaries",
            o."alternativeDomains",
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
            o."weakIdentities",
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

  public async markOrganizationCacheEnriched(cacheId: string): Promise<void> {
    await this.db().none(
      `
      update "organizationCaches"
      set "lastEnrichedAt" = now()
      where id = $(cacheId)
      `,
      {
        cacheId,
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
        (i) => i.platform === newIdentity.platform && i.name === newIdentity.name,
      )

      if (existingIdentity) {
        // we are only updating the url if needed nothing else
        if (existingIdentity.url !== newIdentity.url) {
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
          name: i.name,
          platform: i.platform,
          organizationId,
          tenantId,
          url: i.url,
        }
      })

      const query =
        this.dbInstance.helpers.update(
          entries,
          ['?organizationId', '?tenantId', '?platform', '?name', 'url'],
          'organizationIdentities',
        ) +
        ' where t."organizationId" = v."organizationId"::uuid and t.platform = v.platform and t.name = v.name and t."tenantId" = v."tenantId"::uuid'

      queries.push(query)
    }

    if (toCreate.length > 0) {
      // generate bulk insert query
      const entries = toCreate.map((i) => {
        return {
          name: i.name,
          platform: i.platform,
          organizationId,
          tenantId,
          url: i.url,
        }
      })

      const query =
        this.dbInstance.helpers.insert(
          entries,
          ['organizationId', 'tenantId', 'platform', 'name', 'url'],
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
            identity.name,
          )})`,
      )
      .join(', ')

    const results = await this.db().any(
      `
      with input_identities (platform, name) as (
        values ${identityParams}
      )
      select oi.url, i.platform, i.name
      from "organizationIdentities" oi
        inner join input_identities i on oi.platform = i.platform and oi.name = i.name
      where oi."tenantId" = $(tenantId) and oi."organizationId" <> $(organizationId)
`,
      params,
    )

    return results
  }

  private static readonly ENRICHABLE_ORGANIZATION_FIELDS = [
    'description',
    'emails',
    'phoneNumbers',
    'logo',
    'tags',
    'twitter',
    'linkedin',
    'crunchbase',
    'employees',
    'revenueRange',
    'location',
    'github',
    'website',
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
    'affiliatedProfiles',
    'allSubsidiaries',
    'alternativeDomains',
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

        // ignore null/undefined/empty string values
        if (
          enrichedValue === null ||
          enrichedValue === undefined ||
          (typeof enrichedValue === 'string' && enrichedValue.trim() === '')
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

  public async updateOrganizationCacheWithEnrichedData(
    originalData: IOrganizationCacheData,
    enrichedData: any,
  ): Promise<void> {
    this.ensureTransactional()

    const toUpdate: Record<string, unknown> = {}

    const name = enrichedData.displayName

    if (name && originalData.identities.find((i) => i.name === name.trim()) === undefined) {
      await this.db().none(
        `insert into "organizationCacheIdentities"(id, name) values($(id), $(name))`,
        {
          id: originalData.id,
          name: name.trim(),
        },
      )
    }

    for (const field of OrganizationRepository.ENRICHABLE_ORGANIZATION_FIELDS) {
      if (field in enrichedData) {
        const enrichedValue = enrichedData[field]

        // ignore null/undefined/empty string values
        if (
          enrichedValue === null ||
          enrichedValue === undefined ||
          (typeof enrichedValue === 'string' && enrichedValue.trim() === '')
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

    const keysToUpdate = Object.keys(toUpdate).filter((k) => !['website'].includes(k))
    if (keysToUpdate.length > 0) {
      this.log.debug(
        { organizationId: originalData.id },
        `Updating organization cache with enriched data! With ${keysToUpdate.length} fields`,
      )

      if (toUpdate.naics) {
        toUpdate.naics = JSON.stringify(toUpdate.naics)
      }

      // set lastEnrichedAt to now
      keysToUpdate.push('lastEnrichedAt')
      toUpdate.lastEnrichedAt = new Date()

      const query = this.dbInstance.helpers.update(toUpdate, keysToUpdate, 'organizationCaches')

      const result = await this.db().result(`${query} where id = $(id)`, {
        ...toUpdate,
        id: originalData.id,
      })

      this.checkUpdateRowCount(result.rowCount, 1)
    } else {
      await this.markOrganizationCacheEnriched(originalData.id)
    }
  }

  public async anyOtherOrganizationWithTheSameWebsite(
    organizationId: string,
    tenantId: string,
    website: string,
  ): Promise<boolean> {
    const res = await this.db().oneOrNone(
      `select 1 from organizations where 
          "tenantId" = $(tenantId)
          and id <> $(organizationId) 
          and website = $(website)`,
      {
        tenantId,
        organizationId,
        website,
      },
    )

    if (res) {
      return true
    }

    return false
  }

  public async generateMergeSuggestions(
    organizationId: string,
    tenantId: string,
    website: string,
  ): Promise<void> {
    await this.db().none(
      `
      insert into "organizationToMerge"("organizationId", "toMergeId", "similarity", "createdAt", "updatedAt")
      -- find all organization caches that have this website
      with applicable_organization_caches as (select distinct id
                                              from "organizationCacheIdentities"
                                              where website = $(website)),
      -- then find all organizations that are connected to that cache
      -- and are in the correct tenant and are not the same as the organization we are enriching
          applicable_organizations as (select o.id
                                        from "organizationCacheLinks" ocl
                                                inner join applicable_organization_caches aoc on ocl."organizationCacheId" = aoc.id
                                                inner join organizations o on ocl."organizationId" = o.id
                                        where o."tenantId" = $(tenantId)
                                          and o.id <> $(organizationId))
      -- then again filter out the ones that are already in the toMerge and noMerge tables
      -- and insert the rest into the toMerge table
      select $(organizationId), ao.id, 0.9, now(), now()
      from applicable_organizations ao
              left join "organizationNoMerge" anm
                        on anm."organizationId" = $(organizationId) and anm."noMergeId" = ao.id
              left join "organizationToMerge" atm
                        on atm."organizationId" = $(organizationId) and atm."toMergeId" = ao.id
      where anm."noMergeId" is null
        and atm."toMergeId" is null
      -- just in case add this
      on conflict do nothing;
      `,
      {
        organizationId,
        tenantId,
        website,
      },
    )
  }
}
