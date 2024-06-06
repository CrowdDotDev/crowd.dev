import { generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IOrganization,
  IOrganizationIdSource,
  IOrganizationIdentity,
  OrganizationIdentityType,
  SyncStatus,
} from '@crowd/types'
import {
  IDbInsertOrganizationData,
  IDbOrganization,
  IDbUpdateOrganizationData,
  getInsertOrganizationColumnSet,
} from './organization.data'
import { platform } from 'os'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  private readonly insertOrganizationColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertOrganizationColumnSet = getInsertOrganizationColumnSet(this.dbInstance)
  }

  public async getIdentities(
    organizationId: string,
    tenantId: string,
  ): Promise<IOrganizationIdentity[]> {
    return await this.db().any(
      `
      select "sourceId", platform, value, type, verified, "integrationId" from "organizationIdentities"
      where "organizationId" = $(organizationId) and "tenantId" = $(tenantId)
    `,
      {
        organizationId,
        tenantId,
      },
    )
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
                    oi."tenantId" = $(tenantId)
                    and oi.platform = $(platform)
                    and oi.value ilike $(value)
                    and oi.type = $(type)
                    and oi.verified = true
          )
          select o.id,
                  o.description,
                  o.names,
                  o.emails,
                  o.logo,
                  o.tags,
                  o.employees,
                  o.location,
                  o.type,
                  o.size,
                  o.headline,
                  o.industry,
                  o.founded,
                  o.attributes
          from organizations o
          where o."tenantId" = $(tenantId) 
          and o.id in (select "organizationId" from "organizationsWithIdentity")
          limit 1;
      `,
      { tenantId, value: identity.value, platform: identity.platform, type: identity.type },
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
              order by oi."updatedAt" desc
              limit 1
          )
      select  o.id,
              o.description,
              o.names,
              o.emails,
              o.logo,
              o.tags,
              o.employees,
              o.location,
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
        o.names,
        o.emails,
        o.logo,
        o.tags,
        o.employees,
        o.location,
        o.type,
        o.size,
        o.headline,
        o.industry,
        o.founded,
        o.attributes
      FROM
        organizations o
      WHERE
        o."tenantId" = $(tenantId) AND 
        exists (select 1 from "organizationIdentities" where "organizationId" = o.id and type = '${OrganizationIdentityType.PRIMARY_DOMAIN}' and value = $(domain) and verified = true) AND
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
        names: [domain],
        identities: [
          {
            platform: 'email',
            type: OrganizationIdentityType.PRIMARY_DOMAIN,
            verified: true,
            value: domain,
          },
        ],
        url: null,
        description: null,
        emails: null,
        logo: null,
        tags: null,
        employees: null,
        location: null,
        type: null,
        size: null,
        headline: null,
        industry: null,
        founded: null,
        attributes: null,
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

  public async insert(tenantId: string, data: IDbInsertOrganizationData): Promise<string> {
    const id = generateUUIDv1()
    const ts = new Date()
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        id,
        tenantId,
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
    // handle manuallyChanged
    const result = await this.db().oneOrNone(
      `select id, "manuallyChangedFields" from organizations where id = $(id)`,
      {
        id,
      },
    )
    if (!result) {
      throw new Error(`Organization with id ${id} not found!`)
    }
    const manuallyChangedFields = result.manuallyChangedFields || []
    for (const column of manuallyChangedFields) {
      if (column in data) {
        delete data[column]
      }
    }

    const keys = Object.keys(data)
    keys.push('updatedAt')
    // construct dynamic column set
    const dynamicColumnSet = new this.dbInstance.helpers.ColumnSet(keys, {
      table: {
        table: 'organizations',
      },
    })

    const updatedAt = new Date()
    const oneMinuteAgo = new Date(updatedAt.getTime() - 60 * 1000)
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        updatedAt,
      },
      dynamicColumnSet,
    )

    const query = this.dbInstance.helpers.update(prepared, dynamicColumnSet)
    const condition = this.format('where id = $(id) and "updatedAt" <= $(oneMinuteAgo)', {
      id,
      oneMinuteAgo,
    })

    await this.db().result(`${query} ${condition}`)
  }

  public async updateIdentity(
    organizationId: string,
    tenantId: string,
    identity: IOrganizationIdentity,
  ): Promise<void> {
    const query = `
      update "organizationIdentities" set verified = $(verified)
      where "organizationId" = $(organizationId) and "tenantId" = $(tenantId) and platform = $(platform) and value = $(value) and type = $(type)
    `

    await this.db().none(query, {
      organizationId,
      tenantId,
      platform: identity.platform,
      value: identity.value,
      type: identity.type,
      verified: identity.verified,
    })
  }

  public async addIdentity(
    organizationId: string,
    tenantId: string,
    identity: IOrganizationIdentity,
  ): Promise<void> {
    const query = `
    insert into "organizationIdentities"("organizationId", platform, value, type, verified, "sourceId", "tenantId", "integrationId", "createdAt")
    values ($(organizationId), $(platform), $(value), $(type), $(verified), $(sourceId), $(tenantId), $(integrationId), now())
    on conflict do nothing;
    `

    await this.db().none(query, {
      organizationId,
      platform: identity.platform,
      sourceId: identity.sourceId || null,
      value: identity.value,
      tenantId,
      integrationId: identity.integrationId,
      type: identity.type,
      verified: identity.verified,
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

  public async addToMember(memberId: string, orgs: IOrganizationIdSource[]): Promise<void> {
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
