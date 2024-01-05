import { singleOrDefault } from '@crowd/common'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getTenantOrganizationsToEnrich(
    tenantId: string,
    perPage: number,
    lastId?: string,
  ): Promise<string[]> {
    let results
    if (lastId) {
      results = await this.db().any(
        `
        select id
        from organizations
        where 
          "tenantId" = $(tenantId) and
          ("lastEnrichedAt" is null or "lastEnrichedAt" < now() - interval '3 months') and
          id > $(lastId)
        order by id
        limit ${perPage}
        `,
        {
          tenantId,
          lastId,
        },
      )
    } else {
      results = await this.db().any(
        `
        select id
        from organizations
        where 
          "tenantId" = $(tenantId) and
          ("lastEnrichedAt" is null or "lastEnrichedAt" < now() - interval '3 months')
        order by id
        limit ${perPage}
        `,
        {
          tenantId,
        },
      )
    }

    return results.map((r) => r.id)
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
                          group by oi."organizationId"),
          org_activities as (select a."organizationId", count(a.id) as "activityCount"
                              from activities a
                              where a."organizationId" = $(organizationId)
                                and a."deletedAt" is null
                              group by a."organizationId"
                              having count(id) > 0)
      select  o.id,
              o."tenantId",
              o.website,
              o."manuallyChangedFields"
              i.identities,
              o."weakIdentities",
              coalesce(a."activityCount", 0) as "orgActivityCount"
      from organizations o
              inner join identities i on o.id = i."organizationId"
              left join org_activities a on o.id = a."organizationId"
      where o.id = $(organizationId);
      `,
      {
        organizationId,
      },
    )
  }

  public async markEnriched(organizationId: string): Promise<void> {
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
      // TODO Fix this - we can have multiple identities per platform
      const existingIdentity = singleOrDefault(
        existingIdentities,
        (i) => i.platform === newIdentity.platform && i.name === newIdentity.name,
      )

      if (existingIdentity) {
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
        }
      })

      const query =
        this.dbInstance.helpers.update(
          entries,
          ['?organizationId', '?tenantId', '?platform', '?name', 'url'],
          'organizationIdentities',
        ) +
        ' where t."organizationId" = v."organizationId" and t.platform = v.platform and t.name = v.name and t."tenantId" = v."tenantId"'

      queries.push(query)
    }

    if (toCreate.length > 0) {
      const entries = toCreate.map((i) => {
        return {
          name: i.name,
          platform: i.platform,
          organizationId,
          tenantId,
        }
      })

      const query =
        this.dbInstance.helpers.insert(
          entries,
          ['organizationId', 'tenantId', 'platform', 'name'],
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
      .map((identity) => `('${identity.platform}', '${identity.name}')`)
      .join(', ')

    const results = await this.db().any(
      `
  with input_identities (platform, name) as (
    values ${identityParams}
  )
  select oi.url, i.platform, i.username
  from "organizationIdentities" oi
    inner join input_identities i on oi.platform = i.platform and oi.name = i.name
  where mi."tenantId" = $(tenantId) and oi."organizationId" <> $(organizationId)
`,
      params,
    )

    return results
  }

  public async generateMergeSuggestions(
    organizationId: string,
    tenantId: string,
    website: string,
  ): Promise<void> {}
}

export interface IOrganizationIdentity {
  platform: string
  name: string
  url: string | null
}

export interface IOrganizationData {
  id: string
  tenantId: string
  orgActivityCount: number
  website: string | null
  manuallyChangedFields: string[]
  identities: IOrganizationIdentity[]
  weakIdentities: IOrganizationIdentity[]
}
