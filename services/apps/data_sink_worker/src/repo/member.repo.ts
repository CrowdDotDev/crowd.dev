import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  getInsertMemberColumnSet,
  getInsertMemberIdentityColumnSet,
  getInsertMemberSegmentColumnSet,
  getSelectMemberColumnSet,
  getUpdateMemberColumnSet,
  IDbMember,
  IDbMemberCreateData,
  IDbMemberUpdateData,
} from './member.data'
import { IMemberIdentity } from '@crowd/types'
import { generateUUIDv1 } from '@crowd/common'

export default class MemberRepository extends RepositoryBase<MemberRepository> {
  private readonly insertMemberColumnSet: DbColumnSet
  private readonly updateMemberColumnSet: DbColumnSet
  private readonly selectMemberColumnSet: DbColumnSet
  private readonly selectMemberQuery: string

  private readonly insertMemberIdentityColumnSet: DbColumnSet
  private readonly insertMemberSegmentColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.insertMemberColumnSet = getInsertMemberColumnSet(this.dbInstance)
    this.updateMemberColumnSet = getUpdateMemberColumnSet(this.dbInstance)
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
      where "tenantId" = $(tenantId)
      and $(email) = ANY ("emails")
    `,
      {
        tenantId,
        email,
      },
    )
  }

  public async findMember(
    tenantId: string,
    segmentId: string,
    platform: string,
    username: string,
  ): Promise<IDbMember | null> {
    return await this.db().oneOrNone(
      `${this.selectMemberQuery}
      where m.id in (select ms."memberId"
                    from "memberSegments" ms
                              inner join "memberIdentities" mi
                                        on ms."tenantId" = mi."tenantId" and ms."memberId" = mi."memberId"
                    where ms."tenantId" = $(tenantId)
                      and ms."segmentId" = $(segmentId)
                      and mi.platform = $(platform)
                      and mi.username = $(username));
    `,
      {
        tenantId,
        segmentId,
        platform,
        username,
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
      .map((identity) => `('${identity.platform}', '${identity.username}')`)
      .join(', ')

    const result = await this.db().any(
      `
      with input_identities (platform, username) as (
        values ${identityParams}
      )
      select "memberId", i.platform, i.username
      from "memberIdentities" mi
        inner join input_identities i on mi.platform = i.platform and mi.username = i.username
      where mi."tenantId" = $(tenantId) ${condition}
    `,
      params,
    )

    // Map the result to a Map<IMemberIdentity, string>
    const resultMap = new Map<string, string>()
    result.forEach((row) => {
      resultMap.set(`${row.platform}:${row.username}`, row.memberId)
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
        reach: {
          total: -1,
        },
        weakIdentities: JSON.stringify(data.weakIdentities || []),
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
    const prepared = RepositoryBase.prepare(
      {
        ...data,
        weakIdentities: JSON.stringify(data.weakIdentities || []),
        updatedAt: new Date(),
      },
      this.updateMemberColumnSet,
    )
    const query = this.dbInstance.helpers.update(prepared, this.updateMemberColumnSet)

    const condition = this.format('where id = $(id) and "tenantId" = $(tenantId)', {
      id,
      tenantId,
    })
    const result = await this.db().result(`${query} ${condition}`)

    this.checkUpdateRowCount(result.rowCount, 1)
  }

  public async getIdentities(memberId: string, tenantId: string): Promise<IMemberIdentity[]> {
    return await this.db().any(
      `
      select "sourceId", "platform", "username" from "memberIdentities"
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
    const formattedIdentities = identities
      .map((i) => `('${i.platform}', '${i.username}')`)
      .join(', ')

    const query = `delete from "memberIdentities"
      where "memberId" = $(memberId) and
      "tenantId" = $(tenantId) and
      ("platform", "username") in (${formattedIdentities});
    `

    const result = await this.db().result(query, {
      memberId,
      tenantId,
      formattedIdentities,
    })

    this.checkUpdateRowCount(result.rowCount, identities.length)
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
        username: i.username,
      }
    })

    const preparedObjects = RepositoryBase.prepareBatch(objects, this.insertMemberIdentityColumnSet)
    const query = this.dbInstance.helpers.insert(
      preparedObjects,
      this.insertMemberIdentityColumnSet,
    )
    await this.db().none(query)
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
}
