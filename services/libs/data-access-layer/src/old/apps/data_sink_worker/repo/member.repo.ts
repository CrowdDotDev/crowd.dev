import { generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberIdentity, MemberIdentityType, SyncStatus } from '@crowd/types'

import {
  deleteManyMemberIdentities,
  insertManyMemberIdentities,
} from '../../../../member_identities'
import { PgPromiseQueryExecutor } from '../../../../queryExecutor'

import {
  IDbMember,
  IDbMemberCreateData,
  IDbMemberUpdateData,
  getInsertMemberColumnSet,
  getInsertMemberIdentityColumnSet,
  getInsertMemberSegmentColumnSet,
  getSelectMemberColumnSet,
} from './member.data'

export default class MemberRepository extends RepositoryBase<MemberRepository> {
  private readonly insertMemberColumnSet: DbColumnSet
  private readonly selectMemberColumnSet: DbColumnSet
  private readonly selectMemberQuery: string

  private readonly insertMemberIdentityColumnSet: DbColumnSet
  private readonly insertMemberSegmentColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertMemberColumnSet = getInsertMemberColumnSet(this.dbInstance)
    this.selectMemberColumnSet = getSelectMemberColumnSet(this.dbInstance)

    this.selectMemberQuery = `
      select ${this.selectMemberColumnSet.columns.map((c) => `m."${c.name}"`).join(', ')}
      from "members" m
    `
    this.insertMemberIdentityColumnSet = getInsertMemberIdentityColumnSet(this.dbInstance)
    this.insertMemberSegmentColumnSet = getInsertMemberSegmentColumnSet(this.dbInstance)
  }

  public async findMemberByEmail(tenantId: string, email: string): Promise<IDbMember | null> {
    return await this.db().oneOrNone(
      `${this.selectMemberQuery}
      inner join "memberIdentities" mi on m.id = mi."memberId" and mi.verified = true
      where m."tenantId" = $(tenantId)
        and mi.type = $(type)
        and mi.value ilike $(email)
      limit 1
    `,
      {
        tenantId,
        type: MemberIdentityType.EMAIL,
        email,
      },
    )
  }

  public async findMemberByUsername(
    tenantId: string,
    segmentId: string,
    platform: string,
    username: string,
  ): Promise<IDbMember | null> {
    return await this.db().oneOrNone(
      `${this.selectMemberQuery}
      where m.id in (select mi."memberId"
                    from "memberIdentities" mi
                    where mi."tenantId" = $(tenantId)
                      and mi.platform = $(platform)
                      and lower(mi.value) = lower($(username))
                      and mi.type = $(type)
                      limit 1
                    );
    `,
      {
        tenantId,
        segmentId,
        platform,
        username,
        type: MemberIdentityType.USERNAME,
      },
    )
  }

  public async findIdentities(
    tenantId: string,
    identities: IMemberIdentity[],
    memberId?: string,
  ): Promise<Map<string, string>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      tenantId,
    }

    let condition = ''
    if (memberId) {
      condition = 'and "memberId" <> $(memberId)'
      params.memberId = memberId
    }

    const identityParams = identities
      .map((identity) => `('${identity.platform}', '${identity.value}', '${identity.type}')`)
      .join(', ')

    const result = await this.db().any(
      `
      with input_identities (platform, value, type) as (
        values ${identityParams}
      )
      select "memberId", i.platform, i.value, i.type
      from "memberIdentities" mi
        inner join input_identities i on mi.platform = i.platform and mi.value = i.value and mi.type = i.type
      where mi."tenantId" = $(tenantId) ${condition}
    `,
      params,
    )

    const resultMap = new Map<string, string>()
    result.forEach((row) => {
      resultMap.set(`${row.platform}:${row.type}:${row.value}`, row.memberId)
    })

    return resultMap
  }

  public async findById(id: string): Promise<IDbMember | null> {
    return await this.db().oneOrNone(`${this.selectMemberQuery} where m.id = $(id)`, { id })
  }

  public async create(tenantId: string, data: IDbMemberCreateData): Promise<string> {
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
      this.insertMemberColumnSet,
    )
    const query = this.dbInstance.helpers.insert(prepared, this.insertMemberColumnSet)
    await this.db().none(query)
    return id
  }

  public async update(id: string, tenantId: string, data: IDbMemberUpdateData): Promise<void> {
    const keys = Object.keys(data)
    keys.push('updatedAt')
    // construct custom column set
    const dynamicColumnSet = new this.dbInstance.helpers.ColumnSet(keys, {
      table: {
        table: 'members',
      },
    })

    const updatedAt = new Date()

    const prepared = RepositoryBase.prepare(
      {
        ...data,
        updatedAt,
      },
      dynamicColumnSet,
    )
    const query = this.dbInstance.helpers.update(prepared, dynamicColumnSet)

    const condition = this.format(
      'where id = $(id) and "tenantId" = $(tenantId) and "updatedAt" < $(updatedAt)',
      {
        id,
        tenantId,
        updatedAt,
      },
    )
    await this.db().result(`${query} ${condition}`)
  }

  public async getIdentities(memberId: string, tenantId: string): Promise<IMemberIdentity[]> {
    return await this.db().any(
      `
      select "sourceId", platform, value, type, verified from "memberIdentities"
      where "memberId" = $(memberId) and "tenantId" = $(tenantId)
    `,
      {
        memberId,
        tenantId,
      },
    )
  }

  public async removeIdentities(
    memberId: string,
    tenantId: string,
    identities: IMemberIdentity[],
  ): Promise<void> {
    const result = await deleteManyMemberIdentities(new PgPromiseQueryExecutor(this.db()), {
      memberId,
      tenantId,
      identities,
    })

    this.checkUpdateRowCount(result.rowCount, identities.length)
  }

  public async updateIdentities(
    memberId: string,
    tenantId: string,
    identities: IMemberIdentity[],
  ): Promise<void> {
    const objects = identities.map((i) => {
      return {
        memberId,
        tenantId,
        platform: i.platform,
        value: i.value,
        type: i.type,
        verified: i.verified,
      }
    })

    const query =
      this.dbInstance.helpers.update(
        objects,
        ['verified', '?memberId', '?tenantId', '?platform', '?type', '?value'],
        'memberIdentities',
      ) +
      ' where t."memberId" = v."memberId"::uuid and t."tenantId" = v."tenantId"::uuid and t.platform = v.platform and t.type = v.type and t.value = v.value'

    await this.db().none(query)
  }

  public async insertIdentities(
    memberId: string,
    tenantId: string,
    integrationId: string,
    identities: IMemberIdentity[],
  ): Promise<void> {
    const objects = identities.map((i) => {
      return {
        memberId,
        tenantId,
        integrationId,
        platform: i.platform,
        sourceId: i.sourceId,
        value: i.value,
        type: i.type,
        verified: i.verified,
      }
    })

    await insertManyMemberIdentities(new PgPromiseQueryExecutor(this.db()), objects)
  }

  public async addToSegment(memberId: string, tenantId: string, segmentId: string): Promise<void> {
    const prepared = RepositoryBase.prepare(
      {
        memberId,
        tenantId,
        segmentId,
      },
      this.insertMemberSegmentColumnSet,
    )

    const query =
      this.dbInstance.helpers.insert(prepared, this.insertMemberSegmentColumnSet) +
      ' ON CONFLICT DO NOTHING'
    await this.db().none(query)
  }

  public async addToSyncRemote(memberId: string, integrationId: string, sourceId: string) {
    await this.db().none(
      `insert into "membersSyncRemote" ("id", "memberId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
      values
          ($(id), $(memberId), $(sourceId), $(integrationId), $(syncFrom), $(metaData), $(lastSyncedAt), $(status))
          on conflict do nothing`,
      {
        id: generateUUIDv1(),
        memberId,
        sourceId,
        integrationId,
        syncFrom: 'enrich',
        metaData: null,
        lastSyncedAt: null,
        status: SyncStatus.NEVER,
      },
    )
  }

  public async getMemberIdsAndEmailsAndCount(
    tenantId: string,
    segmentIds: string[],
    { limit = 20, offset = 0, orderBy = 'joinedAt_DESC', countOnly = false },
  ) {
    let orderByString = ''
    const orderByParts = orderBy.split('_')
    const direction = orderByParts[1].toLowerCase()

    switch (orderByParts[0]) {
      case 'joinedAt':
        orderByString = 'm."joinedAt"'
        break
      case 'displayName':
        orderByString = 'm."displayName"'
        break
      case 'reach':
        orderByString = "(m.reach ->> 'total')::int"
        break
      case 'score':
        orderByString = 'm.score'
        break

      default:
        throw new Error(`Invalid order by: ${orderBy}!`)
    }

    orderByString = `${orderByString} ${direction}`

    const memberCount = await this.db().one(
      `
      SELECT count(*) FROM (
        SELECT m.id
        FROM "members" m
        JOIN "memberSegments" ms ON ms."memberId" = m.id
        WHERE m."tenantId" = $(tenantId)
        AND ms."segmentId" = ANY($(segmentIds)::uuid[])
      ) as count
      `,
      {
        tenantId,
        segmentIds,
      },
    )

    if (countOnly) {
      return {
        totalCount: Number(memberCount.count),
        members: [],
      }
    }

    const members = await this.db().any(
      `
      with member_emails as (
        select mi."memberId", array_agg(mi.value) as emails
        from "memberIdentities" mi
        where mi."tenantId" = $(tenantId) and
              mi.verified = true and
              mi.type = '${MemberIdentityType.EMAIL}'
        group by mi."memberId"
      )
      SELECT m.id, me.emails
      FROM "members" m
      JOIN "memberSegments" ms ON ms."memberId" = m.id
      JOIN member_emails me on me."memberId" = m.id
      WHERE m."tenantId" = $(tenantId)
      AND ms."segmentId" = ANY($(segmentIds)::uuid[])
      ORDER BY ${orderByString}
      LIMIT $(limit) OFFSET $(offset)
      `,
      {
        tenantId,
        segmentIds,
        limit,
        offset,
      },
    )

    return {
      totalCount: Number(memberCount.count),
      members: members,
    }
  }
}
