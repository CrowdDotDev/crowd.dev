import { SERVICE_CONFIG } from '@/conf'
import { IDbMemberSyncData } from '@/repo/member.data'
import { MemberRepository } from '@/repo/member.repo'
import { OpenSearchIndex } from '@/types'
import { distinct, distinctBy, groupBy, timeout } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, logExecutionTime } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Edition, IMemberAttribute, MemberAttributeType } from '@crowd/types'
import { IIndexRequest, IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { SegmentRepository } from '@/repo/segment.repo'
import { IDbSegmentInfo } from '@/repo/segment.data'

export class MemberSyncService extends LoggerBase {
  private readonly memberRepo: MemberRepository
  private readonly segmentRepo: SegmentRepository

  constructor(
    redisClient: RedisClient,
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.memberRepo = new MemberRepository(redisClient, store, this.log)
    this.segmentRepo = new SegmentRepository(store, this.log)
  }

  public async getAllIndexedTenantIds(
    pageSize = 500,
    afterKey?: string,
  ): Promise<IPagedSearchResponse<string, string>> {
    const include = ['uuid_tenantId']

    const results = await this.openSearchService.search(
      OpenSearchIndex.MEMBERS,
      undefined,
      {
        uuid_tenantId_buckets: {
          composite: {
            size: pageSize,
            sources: [
              {
                uuid_tenantId: {
                  terms: {
                    field: 'uuid_tenantId',
                  },
                },
              },
            ],
            after: afterKey
              ? {
                  uuid_tenantId: afterKey,
                }
              : undefined,
          },
        },
      },
      undefined,
      undefined,
      undefined,
      include,
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (results as any).uuid_tenantId_buckets

    const newAfterKey = data.after_key?.uuid_tenantId

    const ids = data.buckets.map((b) => b.key.uuid_tenantId)

    return {
      data: ids,
      afterKey: newAfterKey,
    }
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
    const include = ['date_joinedAt', 'uuid_memberId']
    const pageSize = 500
    let lastJoinedAt: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.MEMBERS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ date_joinedAt: string; uuid_memberId: string }>[]

    let processed = 0

    while (results.length > 0) {
      // check every member if they exists in the database and if not remove them from the index
      const dbIds = await this.memberRepo.checkMembersExists(
        tenantId,
        results.map((r) => r._source.uuid_memberId),
      )

      const toRemove = results
        .filter((r) => !dbIds.includes(r._source.uuid_memberId))
        .map((r) => r._id)

      if (toRemove.length > 0) {
        this.log.warn({ tenantId, toRemove }, 'Removing members from index!')
        for (const id of toRemove) {
          await this.openSearchService.removeFromIndex(id, OpenSearchIndex.MEMBERS)
        }
      }

      processed += results.length
      this.log.warn({ tenantId }, `Processed ${processed} members while cleaning up tenant!`)

      // use last joinedAt to get the next page
      lastJoinedAt = results[results.length - 1]._source.date_joinedAt
      results = (await this.openSearchService.search(
        OpenSearchIndex.MEMBERS,
        query,
        undefined,
        pageSize,
        sort,
        lastJoinedAt,
        include,
      )) as ISearchHit<{ date_joinedAt: string; uuid_memberId: string }>[]
    }

    this.log.warn({ tenantId }, `Processed total of ${processed} members while cleaning up tenant!`)
  }

  public async removeMember(memberId: string): Promise<void> {
    this.log.debug({ memberId }, 'Removing member from index!')

    const query = {
      bool: {
        filter: {
          term: {
            uuid_memberId: memberId,
          },
        },
      },
    }

    const sort = [{ date_joinedAt: 'asc' }]
    const include = ['date_joinedAt']
    const pageSize = 10
    let lastJoinedAt: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.MEMBERS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ date_joinedAt: string }>[]

    while (results.length > 0) {
      const ids = results.map((r) => r._id)
      for (const id of ids) {
        await this.openSearchService.removeFromIndex(id, OpenSearchIndex.MEMBERS)
      }

      // use last joinedAt to get the next page
      lastJoinedAt = results[results.length - 1]._source.date_joinedAt
      results = (await this.openSearchService.search(
        OpenSearchIndex.MEMBERS,
        query,
        undefined,
        pageSize,
        sort,
        lastJoinedAt,
        include,
      )) as ISearchHit<{ date_joinedAt: string }>[]
    }
  }

  public async syncTenantMembers(
    tenantId: string,
    batchSize = 200,
    syncCutoffTime?: string,
  ): Promise<void> {
    const cutoffDate = syncCutoffTime ? syncCutoffTime : new Date().toISOString()

    this.log.warn({ tenantId, cutoffDate }, 'Syncing all tenant members!')
    let docCount = 0
    let memberCount = 0

    const isMultiSegment = SERVICE_CONFIG().edition === Edition.LFX

    await logExecutionTime(
      async () => {
        const attributes = await this.memberRepo.getTenantMemberAttributes(tenantId)

        let memberIds = await this.memberRepo.getTenantMembersForSync(
          tenantId,
          1,
          batchSize,
          cutoffDate,
        )

        while (memberIds.length > 0) {
          const members = await this.memberRepo.getMemberData(memberIds)

          if (members.length > 0) {
            let childSegmentIds: string[] | undefined
            let segmentInfos: IDbSegmentInfo[] | undefined

            if (isMultiSegment) {
              childSegmentIds = distinct(members.map((m) => m.segmentId))
              segmentInfos = await this.segmentRepo.getParentSegmentIds(childSegmentIds)
            }

            const grouped = groupBy(members, (m) => m.id)
            memberIds = Array.from(grouped.keys())

            const forSync: IIndexRequest<unknown>[] = []
            for (const memberId of memberIds) {
              const memberDocs = grouped.get(memberId)
              if (isMultiSegment) {
                // index each of them individually
                for (const member of memberDocs) {
                  const prepared = MemberSyncService.prefixData(member, attributes)
                  forSync.push({
                    id: `${memberId}-${member.segmentId}`,
                    body: prepared,
                  })
                }

                const relevantSegmentInfos = segmentInfos.filter(
                  (s) => s.id === memberDocs[0].segmentId,
                )

                // and for each parent and grandparent
                const parentIds = distinct(relevantSegmentInfos.map((s) => s.parentId))
                for (const parentId of parentIds) {
                  const aggregated = MemberSyncService.aggregateData(
                    memberDocs,
                    relevantSegmentInfos,
                    parentId,
                  )
                  const prepared = MemberSyncService.prefixData(aggregated, attributes)
                  forSync.push({
                    id: `${memberId}-${parentId}`,
                    body: prepared,
                  })
                }

                const grandParentIds = distinct(relevantSegmentInfos.map((s) => s.grandParentId))
                for (const grandParentId of grandParentIds) {
                  const aggregated = MemberSyncService.aggregateData(
                    memberDocs,
                    relevantSegmentInfos,
                    undefined,
                    grandParentId,
                  )
                  const prepared = MemberSyncService.prefixData(aggregated, attributes)
                  forSync.push({
                    id: `${memberId}-${grandParentId}`,
                    body: prepared,
                  })
                }
              } else {
                if (memberDocs.length > 1) {
                  throw new Error(
                    'More than one member found - this can not be the case in single segment edition!',
                  )
                }

                const member = memberDocs[0]
                const prepared = MemberSyncService.prefixData(member, attributes)
                forSync.push({
                  id: `${memberId}-${member.segmentId}`,
                  body: prepared,
                })
              }
            }

            await this.openSearchService.bulkIndex(OpenSearchIndex.MEMBERS, forSync)
            docCount += forSync.length
            memberCount += memberIds.length
          }

          await this.memberRepo.markSynced(memberIds)

          this.log.info({ tenantId }, `Synced ${memberCount} members with ${docCount} documents!`)
          memberIds = await this.memberRepo.getTenantMembersForSync(
            tenantId,
            1,
            batchSize,
            cutoffDate,
          )
        }
      },
      this.log,
      'sync-tenant-members',
    )

    this.log.info(
      { tenantId },
      `Synced total of ${memberCount} members with ${docCount} documents!`,
    )
  }

  public async syncMember(memberId: string, retries = 0): Promise<void> {
    this.log.debug({ memberId }, 'Syncing member!')

    const members = await this.memberRepo.getMemberData([memberId])

    if (members.length > 0) {
      if (SERVICE_CONFIG().edition === Edition.LFX) {
        const attributes = await this.memberRepo.getTenantMemberAttributes(members[0].tenantId)

        // get all child segment ids
        const childSegmentIds = members.map((m) => m.segmentId)
        // fetch parentId and grandParentId for each of them
        const segmentInfos = await this.segmentRepo.getParentSegmentIds(childSegmentIds)

        // index each of them individually
        for (const member of members) {
          const prepared = MemberSyncService.prefixData(member, attributes)
          await this.openSearchService.index(
            `${memberId}-${member.segmentId}`,
            OpenSearchIndex.MEMBERS,
            prepared,
          )
        }

        // and for each parent and grandparent
        const parentIds = distinct(segmentInfos.map((s) => s.parentId))
        for (const parentId of parentIds) {
          const aggregated = MemberSyncService.aggregateData(members, segmentInfos, parentId)
          const prepared = MemberSyncService.prefixData(aggregated, attributes)
          await this.openSearchService.index(
            `${memberId}-${parentId}`,
            OpenSearchIndex.MEMBERS,
            prepared,
          )
        }

        const grandParentIds = distinct(segmentInfos.map((s) => s.grandParentId))
        for (const grandParentId of grandParentIds) {
          const aggregated = MemberSyncService.aggregateData(
            members,
            segmentInfos,
            undefined,
            grandParentId,
          )
          const prepared = MemberSyncService.prefixData(aggregated, attributes)
          await this.openSearchService.index(
            `${memberId}-${grandParentId}`,
            OpenSearchIndex.MEMBERS,
            prepared,
          )
        }
      } else {
        if (members.length > 1) {
          throw new Error(
            'More than one member found - this can not be the case in single segment edition!',
          )
        }

        const member = members[0]
        const attributes = await this.memberRepo.getTenantMemberAttributes(member.tenantId)

        const prepared = MemberSyncService.prefixData(member, attributes)
        await this.openSearchService.index(
          `${memberId}-${member.segmentId}`,
          OpenSearchIndex.MEMBERS,
          prepared,
        )
      }

      await this.memberRepo.markSynced([memberId])
    } else {
      // we should retry - sometimes database is slow
      if (retries < 5) {
        await timeout(200)
        await this.syncMember(memberId, ++retries)
      } else {
        this.log.error({ memberId }, 'Member not found after 5 retries! Removing from index!')
        await this.removeMember(memberId)
      }
    }
  }

  private static aggregateData(
    segmentMembers: IDbMemberSyncData[],
    segmentInfos: IDbSegmentInfo[],
    parentId?: string,
    grandParentId?: string,
  ): IDbMemberSyncData | undefined {
    if (!parentId && !grandParentId) {
      throw new Error('Either parentId or grandParentId must be provided!')
    }

    const relevantSubchildIds: string[] = []
    for (const si of segmentInfos) {
      if (parentId && si.parentId === parentId) {
        relevantSubchildIds.push(si.id)
      } else if (grandParentId && si.grandParentId === grandParentId) {
        relevantSubchildIds.push(si.id)
      }
    }

    const members = segmentMembers.filter((m) => relevantSubchildIds.includes(m.segmentId))

    if (members.length === 0) {
      throw new Error('No members found for given parent or grandParent segment id!')
    }

    // aggregate data
    const member = { ...members[0] }

    // use corrent id as segmentId
    if (parentId) {
      member.segmentId = parentId
    } else {
      member.segmentId = grandParentId
    }

    // reset aggregates
    member.activeOn = []
    member.activityCount = 0
    member.activityTypes = []
    member.activeDaysCount = 0
    member.lastActive = undefined
    member.averageSentiment = null
    member.tags = []
    member.organizations = []

    for (const m of members) {
      member.activeOn.push(...m.activeOn)
      member.activityCount += m.activityCount
      member.activityTypes.push(...m.activityTypes)
      member.activeDaysCount += m.activeDaysCount
      if (!member.lastActive) {
        member.lastActive = m.lastActive
      } else if (m.lastActive) {
        const d1 = new Date(member.lastActive)
        const d2 = new Date(m.lastActive)

        if (d1 < d2) {
          member.lastActive = m.lastActive
        }
      }
      if (!member.averageSentiment) {
        member.averageSentiment = m.averageSentiment
      } else if (m.averageSentiment) {
        member.averageSentiment += m.averageSentiment
      }
      member.tags.push(...m.tags)
      member.organizations.push(...m.organizations)
    }

    // average sentiment with the total number of members that have sentiment set
    if (member.averageSentiment) {
      member.averageSentiment = Number(
        (
          member.averageSentiment / members.filter((m) => m.averageSentiment !== null).length
        ).toFixed(2),
      )
    }

    // gather only uniques
    member.activeOn = distinct(member.activeOn)
    member.activityTypes = distinct(member.activityTypes)
    member.tags = distinctBy(member.tags, (t) => t.id)
    member.organizations = distinctBy(member.organizations, (o) => o.id)

    return member
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static prefixData(data: IDbMemberSyncData, attributes: IMemberAttribute[]): any {
    const p: Record<string, unknown> = {}

    p.uuid_memberId = data.id
    p.uuid_tenantId = data.tenantId
    p.uuid_segmentId = data.segmentId
    p.string_displayName = data.displayName
    p.keyword_displayName = data.displayName
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
    p.string_arr_emails = data.emails || []
    p.int_score = data.score
    p.date_lastEnriched = data.lastEnriched ? new Date(data.lastEnriched).toISOString() : null
    p.date_joinedAt = new Date(data.joinedAt).toISOString()
    p.date_createdAt = new Date(data.createdAt).toISOString()
    p.int_totalReach = data.totalReach
    p.int_numberOfOpenSourceContributions = data.numberOfOpenSourceContributions
    p.string_arr_activeOn = data.activeOn
    p.int_activityCount = data.activityCount
    p.string_arr_activityTypes = data.activityTypes
    p.int_activeDaysCount = data.activeDaysCount
    p.date_lastActive = data.lastActive ? new Date(data.lastActive).toISOString() : null
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
        obj_memberOrganizations: {
          string_title: organization.memberOrganizations?.title || null,
          date_dateStart: organization.memberOrganizations?.dateStart || null,
          date_dateEnd: organization.memberOrganizations?.dateEnd || null,
        },
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
