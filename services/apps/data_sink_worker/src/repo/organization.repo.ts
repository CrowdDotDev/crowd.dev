import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IDbCacheOrganization,
  IDbInsertOrganizationCacheData,
  IDbInsertOrganizationData,
  IDbOrganization,
  IDbUpdateOrganizationCacheData,
  IDbUpdateOrganizationData,
  getInsertCacheOrganizationColumnSet,
  getInsertOrganizationColumnSet,
  getUpdateCacheOrganizationColumnSet,
  getUpdateOrganizationColumnSet,
} from './organization.data'
import { generateUUIDv1 } from '@crowd/common'
import { IOrganizationIdentity, SyncStatus, IOrganization } from '@crowd/types'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  private readonly insertCacheOrganizationColumnSet: DbColumnSet
  private readonly updateCacheOrganizationColumnSet: DbColumnSet

  private readonly insertOrganizationColumnSet: DbColumnSet
  private readonly updateOrganizationColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertCacheOrganizationColumnSet = getInsertCacheOrganizationColumnSet(this.dbInstance)
    this.updateCacheOrganizationColumnSet = getUpdateCacheOrganizationColumnSet(this.dbInstance)

    this.insertOrganizationColumnSet = getInsertOrganizationColumnSet(this.dbInstance)
    this.updateOrganizationColumnSet = getUpdateOrganizationColumnSet(this.dbInstance)
  }

  public async findCacheByName(name: string): Promise<IDbCacheOrganization | null> {
    const result = await this.db().oneOrNone(
      `
      select  id,
              name,
              url,
              description,
              emails,
              logo,
              tags,
              github,
              twitter,
              linkedin,
              crunchbase,
              employees,
              location,
              website,
              type,
              size,
              headline,
              industry,
              founded
      from "organizationCaches"
      where name = $(name);`,
      { name },
    )

    return result
  }

  public async insertCache(data: IDbInsertOrganizationCacheData): Promise<string> {
    const id = generateUUIDv1()
    const ts = new Date()
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        id,
        createdAt: ts,
        updatedAt: ts,
      },
      this.insertCacheOrganizationColumnSet,
    )

    const query = this.dbInstance.helpers.insert(prepared, this.insertCacheOrganizationColumnSet)
    await this.db().none(query)
    return id
  }

  public async updateCache(
    id: string,
    data: Partial<IDbUpdateOrganizationCacheData>,
  ): Promise<void> {
    const keys = Object.keys(data)
    keys.push('updatedAt')
    // construct custom column set
    const dynamicColumnSet = new this.dbInstance.helpers.ColumnSet(keys, {
      table: {
        table: 'organizationCaches',
      },
    })

    const prepared = RepositoryBase.prepare(
      {
        ...data,
        updatedAt: new Date(),
      },
      dynamicColumnSet,
    )

    const query = this.dbInstance.helpers.update(prepared, dynamicColumnSet)
    const condition = this.format('where id = $(id)', { id })

    const result = await this.db().result(`${query} ${condition}`)

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getIdentities(
    organizationId: string,
    tenantId: string,
  ): Promise<IOrganizationIdentity[]> {
    return await this.db().any(
      `
      select "sourceId", "platform", "name", "integrationId" from "organizationIdentities"
      where "organizationId" = $(organizationId) and "tenantId" = $(tenantId)
    `,
      {
        organizationId,
        tenantId,
      },
    )
  }

  public async findIdentities(
    tenantId: string,
    identities: IOrganizationIdentity[],
    organizationId?: string,
  ): Promise<Map<string, string>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      tenantId,
    }

    let condition = ''
    if (organizationId) {
      condition = 'and "organizationId" <> $(organizationId)'
      params.organizationId = organizationId
    }

    const identityParams = identities
      .map((identity) => `('${identity.platform}', '${identity.name}')`)
      .join(', ')

    const result = await this.db().any(
      `
      with input_identities (platform, name) as (
        values ${identityParams}
      )
      select "organizationId", i.platform, i.name
      from "organizationIdentities" oi
        inner join input_identities i on oi.platform = i.platform and oi.name = i.name
      where oi."tenantId" = $(tenantId) ${condition}
    `,
      params,
    )

    const resultMap = new Map<string, string>()
    result.forEach((row) => {
      resultMap.set(`${row.platform}:${row.name}`, row.organizationId)
    })

    return resultMap
  }

  public async findInIdentityNames(tenantId: string, name: string): Promise<IDbOrganization> {
    const result = await this.db().oneOrNone(
      `
      with
          "organizationsWithIdentityName" as (
              select oi."organizationId"
              from "organizationIdentities" oi
              where 
                    oi.name = $(name)
              limit 1
          )
          select o.id,
                  o.description,
                  o.emails,
                  o.logo,
                  o.tags,
                  o.github,
                  o.twitter,
                  o.linkedin,
                  o.crunchbase,
                  o.employees,
                  o.location,
                  o.website,
                  o.type,
                  o.size,
                  o.headline,
                  o.industry,
                  o.founded,
                  o.attributes
          from organizations o
          where o."tenantId" = $(tenantId) 
          and o.id in (select "organizationId" from "organizationsWithIdentityName");
      `,
      { tenantId, name },
    )

    return result
  }

  public async findByIdentity(
    tenantId: string,
    identity: IOrganizationIdentity,
  ): Promise<IDbOrganization> {
    const result = await this.db().oneOrNone(
      `
      with
          "organizationsWithIdentity" as (
              select oi."organizationId"
              from "organizationIdentities" oi
              where 
                    oi.platform = $(platform)
                    and oi.name = $(name)
          )
          select o.id,
                  o.description,
                  o.emails,
                  o.logo,
                  o.tags,
                  o.github,
                  o.twitter,
                  o.linkedin,
                  o.crunchbase,
                  o.employees,
                  o.location,
                  o.website,
                  o.type,
                  o.size,
                  o.headline,
                  o.industry,
                  o.founded,
                  o.attributes
          from organizations o
          where o."tenantId" = $(tenantId) 
          and o.id in (select "organizationId" from "organizationsWithIdentity");
      `,
      { tenantId, name: identity.name, platform: identity.platform },
    )

    return result
  }

  public async findBySourceId(
    tenantId: string,
    segmentId: string,
    platform: string,
    sourceId: string,
  ): Promise<IDbOrganization> {
    const result = await this.db().oneOrNone(
      `
      with
          "organizationsWithSourceIdAndSegment" as (
              select oi."organizationId"
              from "organizationIdentities" oi
              join "organizationSegments" os on oi."organizationId" = os."organizationId"
              where 
                    oi.platform = $(platform)
                    and oi."sourceId" = $(sourceId)
                    and os."segmentId" =  $(segmentId)
          )
      select  o.id,
              o.description,
              o.emails,
              o.logo,
              o.tags,
              o.github,
              o.twitter,
              o.linkedin,
              o.crunchbase,
              o.employees,
              o.location,
              o.website,
              o.type,
              o.size,
              o.headline,
              o.industry,
              o.founded,
              o.attributes
      from organizations o
      where o."tenantId" = $(tenantId) 
      and o.id in (select "organizationId" from "organizationsWithSourceIdAndSegment");`,
      { tenantId, sourceId, segmentId, platform },
    )

    return result
  }

  public async findOrCreateByDomain(
    tenantId: string,
    segmentId: string,
    domain: string,
  ): Promise<IOrganization> {
    const results = await this.db().any(
      `
      SELECT
        o.id,
        o.description,
        o.emails,
        o.logo,
        o.tags,
        o.github,
        o.twitter,
        o.linkedin,
        o.crunchbase,
        o.employees,
        o.location,
        o.website,
        o.type,
        o.size,
        o.headline,
        o.industry,
        o.founded,
        o.attributes,
        o."weakIdentities"
      FROM
        organizations o
      WHERE
        o."tenantId" = $(tenantId) AND 
        o.website = $(domain) AND
        o.id IN (
          SELECT os."organizationId"
          FROM "organizationSegments" os
          WHERE os."segmentId" = $(segmentId)
        )
      `,
      {
        tenantId,
        domain,
        segmentId,
      },
    )

    if (results.length === 0) {
      const data = {
        displayName: domain,
        website: domain,
        identities: [
          {
            platform: 'email',
            name: domain,
          },
        ],
        url: null,
        description: null,
        emails: null,
        logo: null,
        tags: null,
        github: null,
        twitter: null,
        linkedin: null,
        crunchbase: null,
        employees: null,
        location: null,
        type: null,
        size: null,
        headline: null,
        industry: null,
        founded: null,
        attributes: null,
        weakIdentities: [],
      }

      const orgId = await this.insert(tenantId, data)

      return {
        id: orgId,
        ...data,
      }
    }

    results.sort((a, b) => {
      const scoreA = Object.values(a).filter((value) => value !== null).length
      const scoreB = Object.values(b).filter((value) => value !== null).length
      return scoreB - scoreA
    })

    return results[0]
  }

  public async findByDomain(tenantId: string, domain: string): Promise<IOrganization> {
    const result = await this.db().oneOrNone(
      `
      SELECT
        o.id,
        o.description,
        o.emails,
        o.logo,
        o.tags,
        o.github,
        o.twitter,
        o.linkedin,
        o.crunchbase,
        o.employees,
        o.location,
        o.website,
        o.type,
        o.size,
        o.headline,
        o.industry,
        o.founded,
        o.attributes,
        o."weakIdentities"
      FROM
        organizations o
      WHERE
        o."tenantId" = $(tenantId) AND 
        o.website = $(domain)
      `,
      {
        tenantId,
        domain,
      },
    )

    return result
  }

  public async insert(tenantId: string, data: IDbInsertOrganizationData): Promise<string> {
    const id = generateUUIDv1()
    const ts = new Date()
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        id,
        tenantId,
        weakIdentities: JSON.stringify(data.weakIdentities || []),
        createdAt: ts,
        updatedAt: ts,
      },
      this.insertOrganizationColumnSet,
    )

    const query = this.dbInstance.helpers.insert(prepared, this.insertOrganizationColumnSet)
    await this.db().none(query)
    return id
  }

  public async update(id: string, data: Partial<IDbUpdateOrganizationData>): Promise<void> {
    const keys = Object.keys(data)
    keys.push('updatedAt')
    // construct dynamic column set
    const dynamicColumnSet = new this.dbInstance.helpers.ColumnSet(keys, {
      table: {
        table: 'organizations',
      },
    })
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        ...(data?.weakIdentities &&
          data?.weakIdentities?.length > 0 && {
            weakIdentities: JSON.stringify(data.weakIdentities),
          }),
        updatedAt: new Date(),
      },
      dynamicColumnSet,
    )

    const query = this.dbInstance.helpers.update(prepared, dynamicColumnSet)
    const condition = this.format('where id = $(id)', { id })

    const result = await this.db().result(`${query} ${condition}`)

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async addIdentity(
    organizationId: string,
    tenantId: string,
    identity: IOrganizationIdentity,
  ): Promise<void> {
    const query = `
    insert into "organizationIdentities"("organizationId", "platform", "name", "url", "sourceId", "tenantId", "integrationId", "createdAt")
    values ($(organizationId), $(platform), $(name), $(url), $(sourceId), $(tenantId), $(integrationId), now())
    on conflict do nothing;
    `

    await this.db().none(query, {
      organizationId,
      platform: identity.platform,
      sourceId: identity.sourceId || null,
      url: identity.url || null,
      tenantId,
      integrationId: identity.integrationId,
      name: identity.name,
    })
  }

  public async addToSegments(tenantId: string, segmentId: string, orgIds: string[]): Promise<void> {
    const parameters: Record<string, unknown> = {
      tenantId,
      segmentId,
    }

    const valueStrings = []
    for (let i = 0; i < orgIds.length; i++) {
      const orgId = orgIds[i]
      parameters[`orgId_${i}`] = orgId
      valueStrings.push(`($(tenantId), $(segmentId), $(orgId_${i}), now())`)
    }

    const valueString = valueStrings.join(',')

    const query = `
    insert into "organizationSegments"("tenantId", "segmentId", "organizationId", "createdAt")
    values ${valueString}
    on conflict do nothing;
    `

    await this.db().none(query, parameters)
  }

  public async addToMember(memberId: string, orgs: IOrganization[]): Promise<void> {
    const parameters: Record<string, unknown> = {
      memberId,
    }

    const valueStrings = []
    for (let i = 0; i < orgs.length; i++) {
      const org = orgs[i]
      parameters[`orgId_${i}`] = org.id
      parameters[`source_${i}`] = org.source
      valueStrings.push(`($(orgId_${i}), $(memberId), now(), now(), $(source_${i}))`)
    }

    const valueString = valueStrings.join(',')

    const query = `
    insert into "memberOrganizations"("organizationId", "memberId", "createdAt", "updatedAt", "source")
    values ${valueString}
    on conflict do nothing;
    `

    await this.db().none(query, parameters)
  }

  public async addToSyncRemote(organizationId: string, integrationId: string, sourceId: string) {
    await this.db().none(
      `insert into "organizationsSyncRemote" ("id", "organizationId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
      values
          ($(id), $(organizationId), $(sourceId), $(integrationId), $(syncFrom), $(metaData), $(lastSyncedAt), $(status))
          on conflict do nothing`,
      {
        id: generateUUIDv1(),
        organizationId,
        sourceId,
        integrationId,
        syncFrom: 'enrich',
        metaData: null,
        lastSyncedAt: null,
        status: SyncStatus.NEVER,
      },
    )
  }
}
