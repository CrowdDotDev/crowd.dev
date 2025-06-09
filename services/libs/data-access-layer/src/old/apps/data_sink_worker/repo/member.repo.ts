import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

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
  getSelectMemberColumnSet,
} from './member.data'

export default class MemberRepository extends RepositoryBase<MemberRepository> {
  private readonly insertMemberColumnSet: DbColumnSet
  private readonly selectMemberColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertMemberColumnSet = getInsertMemberColumnSet(this.dbInstance)
    this.selectMemberColumnSet = getSelectMemberColumnSet(this.dbInstance)
  }

  public async findMembersByEmails(emails: string[]): Promise<Map<string, IDbMember>> {
    const data = {
      type: MemberIdentityType.EMAIL,
      emails: emails.map((e) => e.toLowerCase()),
    }

    const results = await this.db().any(
      `
      with matching_identities as (
        select mi."memberId", mi.value
        from "memberIdentities" mi
        where mi.type = $(type) and lower(mi.value) in ($(emails:csv))
        limit ${emails.length}
      )
      select mi.value as "identityValue", ${this.selectMemberColumnSet.columns.map((c) => `m."${c.name}"`).join(', ')}
      from "members" m inner join matching_identities mi on m.id = mi."memberId"
    `,
      data,
    )

    const resultMap = new Map<string, IDbMember>()

    for (const result of results) {
      resultMap.set(result.identityValue, result)
    }

    return resultMap
  }

  public async findMembersByUsernames(
    params: { segmentId: string; platform: string; username: string }[],
  ): Promise<Map<{ platform: string; value: string }, IDbMember>> {
    const orConditions: string[] = []
    let index = 0

    const data: Record<string, string> = {
      type: MemberIdentityType.USERNAME,
    }

    for (const param of params) {
      const platformParam = `platform_${index++}`
      const usernameParam = `username_${index++}`

      orConditions.push(
        `(mi.platform = $(${platformParam}) and lower(mi.value) = $(${usernameParam}))`,
      )

      data[platformParam] = param.platform
      data[usernameParam] = param.username.toLowerCase()
    }

    const results = await this.db().any(
      `
      with matching_identities as (
        select mi."memberId", mi.platform, mi.value
        from "memberIdentities" mi
        where mi.type = $(type) and (${orConditions.join(' or ')})
        limit ${params.length}
      )
      select mi.platform as "identityPlatform", mi.value as "identityValue", ${this.selectMemberColumnSet.columns.map((c) => `m."${c.name}"`).join(', ')}
      from "members" m inner join matching_identities mi on m.id = mi."memberId"
    `,
      data,
    )

    const resultMap = new Map<{ platform: string; value: string }, IDbMember>()

    for (const result of results) {
      resultMap.set({ platform: result.identityPlatform, value: result.identityValue }, result)
    }

    return resultMap
  }

  public async findIdentities(
    identities: IMemberIdentity[],
    memberId?: string,
  ): Promise<Map<string, string>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {}

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
      where ${condition}
    `,
      params,
    )

    const resultMap = new Map<string, string>()
    result.forEach((row) => {
      resultMap.set(`${row.platform}:${row.type}:${row.value}`, row.memberId)
    })

    return resultMap
  }

  public async findByIds(ids: string[]): Promise<IDbMember[]> {
    return await this.db().any(
      `
      select ${this.selectMemberColumnSet.columns.map((c) => `m."${c.name}"`).join(', ')}
      from "members" m
      where m.id in ($(ids:csv))
    `,
      { ids },
    )
  }

  public async create(data: IDbMemberCreateData): Promise<string> {
    const id = generateUUIDv1()
    const ts = new Date()
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        id,
        tenantId: DEFAULT_TENANT_ID,
        createdAt: ts,
        updatedAt: ts,
      },
      this.insertMemberColumnSet,
    )
    const query = this.dbInstance.helpers.insert(prepared, this.insertMemberColumnSet)
    await this.db().none(query)
    return id
  }

  public async update(id: string, data: IDbMemberUpdateData): Promise<void> {
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

    const condition = this.format('where id = $(id) and "updatedAt" < $(updatedAt)', {
      id,
      updatedAt,
    })
    await this.db().result(`${query} ${condition}`)
  }

  public async getIdentities(memberId: string): Promise<IMemberIdentity[]> {
    return await this.db().any(
      `
      select "sourceId", platform, value, type, verified from "memberIdentities"
      where "memberId" = $(memberId)
    `,
      {
        memberId,
      },
    )
  }

  public async removeIdentities(memberId: string, identities: IMemberIdentity[]): Promise<void> {
    const result = await deleteManyMemberIdentities(new PgPromiseQueryExecutor(this.db()), {
      memberId,
      identities,
    })

    this.checkUpdateRowCount(result.rowCount, identities.length)
  }

  public async updateIdentities(memberId: string, identities: IMemberIdentity[]): Promise<void> {
    const objects = identities.map((i) => {
      return {
        memberId,
        platform: i.platform,
        value: i.value,
        type: i.type,
        verified: i.verified,
      }
    })

    const query =
      this.dbInstance.helpers.update(
        objects,
        ['verified', '?memberId', '?platform', '?type', '?value'],
        'memberIdentities',
      ) +
      ' where t."memberId" = v."memberId"::uuid and t.platform = v.platform and t.type = v.type and t.value = v.value'

    await this.db().none(query)
  }

  public async destroyMemberAfterError(id: string, clearIdentities = false): Promise<void> {
    if (clearIdentities) {
      await this.db().none(`delete from "memberIdentities" where "memberId" = $(id)`, {
        id,
      })
    }

    await this.db().none(
      `
      delete from "members" where id = $(id)
      `,
      { id },
    )
  }

  public async insertIdentities(
    memberId: string,
    integrationId: string,
    identities: IMemberIdentity[],
  ): Promise<void> {
    const objects = identities.map((i) => {
      return {
        memberId,
        integrationId,
        platform: i.platform,
        sourceId: i.sourceId,
        value: i.value,
        type: i.type,
        verified: i.verified,
      }
    })

    await insertManyMemberIdentities(new PgPromiseQueryExecutor(this.db()), objects, true)
  }

  public async addToSegments(memberId: string, segmentIds: string[]): Promise<void> {
    if (segmentIds.length === 0) {
      return
    }

    const params: Record<string, unknown> = {
      tenantId: DEFAULT_TENANT_ID,
      memberId,
    }

    const values: string[] = []
    for (let i = 0; i < segmentIds.length; i++) {
      const paramName = `segmentId_${i}`
      params[paramName] = segmentIds[i]
      values.push(`($(memberId), $(tenantId), $(${paramName}))`)
    }

    const query = `
      insert into "memberSegments"("memberId", "tenantId", "segmentId")
      values ${values.join(', ')}
      on conflict do nothing
    `
    await this.db().none(query, params)
  }

  public async getMemberIdsAndEmailsAndCount(
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
        WHEREms."segmentId" = ANY($(segmentIds)::uuid[])
      ) as count
      `,
      {
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
        where mi.verified = true and
              mi.type = '${MemberIdentityType.EMAIL}'
        group by mi."memberId"
      )
      SELECT m.id, me.emails
      FROM "members" m
      JOIN "memberSegments" ms ON ms."memberId" = m.id
      JOIN member_emails me on me."memberId" = m.id
      WHERE ms."segmentId" = ANY($(segmentIds)::uuid[])
      ORDER BY ${orderByString}
      LIMIT $(limit) OFFSET $(offset)
      `,
      {
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
