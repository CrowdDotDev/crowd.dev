import { IDbMemberSyncData } from '@/repo/member.data'
import { MemberRepository } from '@/repo/member.repo'
import { OpenSearchIndex } from '@/types'
import { timeout } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, logExecutionTime } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { IMemberAttribute, MemberAttributeType } from '@crowd/types'
import { OpenSearchService } from './opensearch.service'
import { ISearchHit } from './opensearch.data'

export class SyncService extends LoggerBase {
  private readonly memberRepo: MemberRepository

  constructor(
    redisClient: RedisClient,
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.memberRepo = new MemberRepository(redisClient, store, this.log)
  }

  public async cleanupMemberIndex(tenantId: string): Promise<void> {
    this.log.warn({ tenantId }, 'Cleaning up member index!')

    const query = {
      bool: {
        filter: {
          term: {
            uuid_tenantId: tenantId,
          },
        },
      },
    }

    const sort = [{ date_joinedAt: 'asc' }]
    const include = ['date_joinedAt']
    const pageSize = 500
    let lastJoinedAt: string

    let results: ISearchHit<{ date_joinedAt: string }>[] = await this.openSearchService.search(
      OpenSearchIndex.MEMBERS,
      query,
      pageSize,
      sort,
      undefined,
      include,
    )

    let processed = 0

    while (results.length > 0) {
      // check every member if they exists in the database and if not remove them from the index
      const ids = results.map((r) => r._id)
      const dbIds = await this.memberRepo.checkMemberExists(tenantId, ids)

      const toRemove = ids.filter((id) => !dbIds.includes(id))

      if (toRemove.length > 0) {
        this.log.warn({ tenantId, toRemove }, 'Removing members from index!')
        for (const id of toRemove) {
          await this.removeMember(id)
        }
      }

      processed += results.length
      this.log.warn({ tenantId }, `Processed ${processed} members while cleaning up tenant!`)

      // use last joinedAt to get the next page
      lastJoinedAt = results[results.length - 1]._source.date_joinedAt
      results = await this.openSearchService.search(
        OpenSearchIndex.MEMBERS,
        query,
        pageSize,
        sort,
        lastJoinedAt,
        include,
      )
    }

    this.log.warn(
      { tenantId },
      `'Processed total of ${processed} members while cleaning up tenant!'`,
    )
  }

  public async removeMember(memberId: string): Promise<void> {
    this.log.warn({ memberId }, 'Removing member from index!')
    await this.openSearchService.removeFromIndex(memberId, OpenSearchIndex.MEMBERS)
  }

  public async syncTenantMembers(tenantId: string): Promise<void> {
    this.log.warn({ tenantId }, 'Syncing all tenant members!')
    let count = 0

    await logExecutionTime(
      async () => {
        await this.memberRepo.setTenanMembersForSync(tenantId)

        const attributes = await this.memberRepo.getTenantMemberAttributes(tenantId)

        const perPage = 1000
        let members = await this.memberRepo.getTenantMembersForSync(tenantId, 1, perPage)

        while (members.length > 0) {
          count += members.length

          await this.openSearchService.bulkIndex(
            OpenSearchIndex.MEMBERS,
            members.map((m) => {
              return {
                id: m.id,
                body: SyncService.prefixData(m, attributes),
              }
            }),
          )

          await this.memberRepo.markSynced(members.map((m) => m.id))

          this.log.info({ tenantId }, `Synced ${count} members!`)
          members = await this.memberRepo.getTenantMembersForSync(tenantId, 1, perPage)
        }
      },
      this.log,
      'tenant-member-sync',
    )

    this.log.info({ tenantId }, `Synced total of ${count} members!`)
  }

  public async syncMember(memberId: string, retries = 0): Promise<void> {
    this.log.debug({ memberId }, 'Syncing member!')

    const member = await this.memberRepo.getMemberData(memberId)

    if (member) {
      const attributes = await this.memberRepo.getTenantMemberAttributes(member.tenantId)

      const prepared = SyncService.prefixData(member, attributes)
      await this.openSearchService.index(memberId, OpenSearchIndex.MEMBERS, prepared)
      await this.memberRepo.markSynced([memberId])
    } else {
      // we should retry - sometimes database is slow
      if (retries < 5) {
        await timeout(100)
        await this.syncMember(memberId, ++retries)
      } else {
        this.log.error({ memberId }, 'Member not found after 5 retries! Removing from index!')
        await this.openSearchService.removeFromIndex(memberId, OpenSearchIndex.MEMBERS)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static prefixData(data: IDbMemberSyncData, attributes: IMemberAttribute[]): any {
    const p: Record<string, unknown> = {}

    p.uuid_id = data.id
    p.uuid_tenantId = data.tenantId
    p.string_displayName = data.displayName
    const p_attributes = {}

    for (const attribute of attributes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attData = data.attributes as any

      if (attribute.name in attData) {
        if (attribute.type === MemberAttributeType.SPECIAL) {
          const data = JSON.stringify(attData[attribute.name])
          p_attributes[`string_${attribute.name}`] = data
        } else {
          const p_data = {}
          const defValue = attData[attribute.name].default
          const prefix = this.attributeTypeToOpenSearchPrefix(defValue, attribute.type)

          for (const key of Object.keys(attData[attribute.name])) {
            p_data[`${prefix}_${key}`] = attData[attribute.name][key]
          }

          p_attributes[`obj_${attribute.name}`] = p_data
        }
      }
    }

    p.obj_attributes = p_attributes
    p.string_arr_emails = data.emails
    p.int_score = data.score
    p.date_lastEnriched = data.lastEnriched
    p.date_joinedAt = data.joinedAt
    p.int_totalReach = data.totalReach
    p.int_numberOfOpenSourceContributions = data.numberOfOpenSourceContributions
    p.string_arr_activeOn = data.activeOn
    p.int_activityCount = data.activityCount
    p.string_arr_activityTypes = data.activityTypes
    p.int_activeDaysCount = data.activeDaysCount
    p.date_lastActive = data.lastActive
    p.float_averageSentiment = data.averageSentiment

    const p_identities = []
    for (const identity of data.identities) {
      p_identities.push({
        string_platform: identity.platform,
        string_username: identity.username,
      })
    }
    p.obj_arr_identities = p_identities

    const p_organizations = []
    for (const organization of data.organizations) {
      p_organizations.push({
        uuid_id: organization.id,
        string_logo: organization.logo,
        string_displayName: organization.displayName,
      })
    }
    p.obj_arr_organizations = p_organizations

    const p_tags = []
    for (const tag of data.tags) {
      p_tags.push({
        uuid_id: tag.id,
        string_name: tag.name,
      })
    }

    p.obj_arr_tags = p_tags

    p.uuid_arr_toMergeIds = data.toMergeIds
    p.uuid_arr_noMergeIds = data.noMergeIds

    return p
  }

  private static attributeTypeToOpenSearchPrefix(
    defValue: unknown,
    type: MemberAttributeType,
  ): string {
    switch (type) {
      case MemberAttributeType.BOOLEAN:
        return 'bool'
      case MemberAttributeType.NUMBER: {
        if ((defValue as number) % 1 === 0) {
          return 'int'
        } else {
          return 'float'
        }
      }
      case MemberAttributeType.EMAIL:
        return 'string'
      case MemberAttributeType.STRING:
        return 'string'
      case MemberAttributeType.URL:
        return 'string'
      case MemberAttributeType.DATE:
        return 'date'
      case MemberAttributeType.MULTI_SELECT:
        return 'string_arr'
      case MemberAttributeType.SPECIAL:
        return 'string'
      default:
        throw new Error(`Could not map attribute type: ${type} to OpenSearch type!`)
    }
  }
}
