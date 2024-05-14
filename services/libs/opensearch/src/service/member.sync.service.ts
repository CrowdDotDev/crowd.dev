import { distinct, trimUtf8ToMaxByteLength } from '@crowd/common'
import {
  filterMembersWithActivities,
  getMemberAggregates,
  getMemberSegmentCouples,
} from '@crowd/data-access-layer'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  Edition,
  IMemberAttribute,
  IMemberSegmentAggregates,
  IServiceConfig,
  MemberAttributeType,
  MemberIdentityType,
} from '@crowd/types'
import { IndexedEntityType } from '../repo/indexing.data'
import { IndexingRepository } from '../repo/indexing.repo'
import { IDbMemberSyncData, IMemberSegmentMatrix } from '../repo/member.data'
import { MemberRepository } from '../repo/member.repo'
import { IDbSegmentInfo } from '../repo/segment.data'
import { SegmentRepository } from '../repo/segment.repo'
import { OpenSearchIndex } from '../types'
import { IMemberSyncResult } from './member.sync.data'
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class MemberSyncService {
  private static MAX_BYTE_LENGTH = 25000
  private log: Logger
  private readonly memberRepo: MemberRepository
  private readonly segmentRepo: SegmentRepository
  private readonly serviceConfig: IServiceConfig
  private readonly indexingRepo: IndexingRepository

  constructor(
    redisClient: RedisClient,
    pgStore: DbStore,
    private readonly qdbStore: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
    serviceConfig: IServiceConfig,
  ) {
    this.log = getChildLogger('member-sync-service', parentLog)
    this.serviceConfig = serviceConfig

    this.memberRepo = new MemberRepository(redisClient, pgStore, this.log)
    this.segmentRepo = new SegmentRepository(pgStore, this.log)
    this.indexingRepo = new IndexingRepository(pgStore, this.log)
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
      const memberData = await this.memberRepo.checkMembersExists(
        tenantId,
        results.map((r) => r._source.uuid_memberId),
      )

      const membersWithActivities = await filterMembersWithActivities(
        this.qdbStore.connection(),
        memberData.map((m) => m.memberId),
      )

      const ids = memberData
        .filter((m) => m.manuallyCreated || membersWithActivities.includes(m.memberId))
        .map((m) => m.memberId)

      const toRemove = results
        .filter((r) => !ids.includes(r._source.uuid_memberId))
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

  public async syncTenantMembers(tenantId: string, batchSize = 200): Promise<void> {
    this.log.debug({ tenantId }, 'Syncing all tenant members!')
    let docCount = 0
    let memberCount = 0

    const now = new Date()

    let memberIds = await this.memberRepo.getTenantMembersForSync(tenantId, batchSize)

    while (memberIds.length > 0) {
      const { membersSynced, documentsIndexed } = await this.syncMembers(memberIds)

      docCount += documentsIndexed
      memberCount += membersSynced

      const diffInSeconds = (new Date().getTime() - now.getTime()) / 1000
      this.log.info(
        { tenantId },
        `Synced ${memberCount} members! Speed: ${Math.round(
          memberCount / diffInSeconds,
        )} members/second!`,
      )

      await this.indexingRepo.markEntitiesIndexed(
        IndexedEntityType.MEMBER,
        memberIds.map((id) => {
          return {
            id,
            tenantId,
          }
        }),
      )

      memberIds = await this.memberRepo.getTenantMembersForSync(tenantId, batchSize)
    }

    this.log.info(
      { tenantId },
      `Synced total of ${memberCount} members with ${docCount} documents!`,
    )
  }

  public async syncOrganizationMembers(organizationId: string, batchSize = 200): Promise<void> {
    this.log.debug({ organizationId }, 'Syncing all organization members!')
    let docCount = 0
    let memberCount = 0

    const now = new Date()

    const loadNextPage = async (lastId?: string): Promise<string[]> => {
      const memberIdData = await this.memberRepo.getOrganizationMembersForSync(
        organizationId,
        batchSize,
        lastId,
      )

      const membersWithActivities = await filterMembersWithActivities(
        this.qdbStore.connection(),
        memberIdData.map((m) => m.memberId),
      )

      return memberIdData
        .filter((m) => m.manuallyCreated || membersWithActivities.includes(m.memberId))
        .map((m) => m.memberId)
    }

    let memberIds: string[] = await loadNextPage()

    while (memberIds.length > 0) {
      const { membersSynced, documentsIndexed } = await this.syncMembers(memberIds)

      docCount += documentsIndexed
      memberCount += membersSynced

      const diffInSeconds = (new Date().getTime() - now.getTime()) / 1000
      this.log.info(
        { organizationId },
        `Synced ${memberCount} members! Speed: ${Math.round(
          memberCount / diffInSeconds,
        )} members/second!`,
      )
      memberIds = await loadNextPage(memberIds[memberIds.length - 1])
    }

    this.log.info(
      { organizationId },
      `Synced total of ${memberCount} members with ${docCount} documents!`,
    )
  }

  public async syncMembers(memberIds: string[], segmentIds?: string[]): Promise<IMemberSyncResult> {
    const CONCURRENT_DATABASE_QUERIES = 10
    const BULK_INDEX_DOCUMENT_BATCH_SIZE = 100

    // get all memberId-segmentId couples
    let memberSegmentCouples: IMemberSegmentMatrix
    if (segmentIds && segmentIds.length > 0) {
      // we have segmentIds as parameters so we don't need to find all that member is in from db
      memberSegmentCouples = await this.memberRepo.getMemberSegmentCouples(
        memberIds,
        [],
        segmentIds,
      )
    } else {
      // first we fetch member - segment couples from activities table in questdb
      const memberSegments = await getMemberSegmentCouples(this.qdbStore.connection(), memberIds)

      // then we further process it to include members without activities (like manual members)
      memberSegmentCouples = await this.memberRepo.getMemberSegmentCouples(
        memberIds,
        memberSegments,
      )
    }

    let databaseStream = []
    let syncStream = []
    let documentsIndexed = 0
    const allMemberIds = Object.keys(memberSegmentCouples)
    const totalMemberIds = allMemberIds.length

    const successfullySyncedMembers = []

    const processSegmentsStream = async (databaseStream): Promise<void> => {
      const results = await Promise.all(databaseStream.map((s) => s.memberDataPromise))

      let index = 0

      while (results.length > 0) {
        const result = results.shift()

        if (!result) {
          index += 1
          continue
        }

        const { memberId, segmentId, aggregatesPromise } = databaseStream[index]
        const memberSegments = memberSegmentCouples[memberId]

        // Find the correct segment and mark it as processed and add the data
        const targetSegment = memberSegments.find((s) => s.segmentId === segmentId)
        targetSegment.processed = true
        targetSegment.data = result
        targetSegment.aggregates = await aggregatesPromise

        // Check if all segments for the member have been processed
        const allSegmentsOfMemberIsProcessed = memberSegments.every((s) => s.processed)
        if (allSegmentsOfMemberIsProcessed) {
          const attributes = await this.memberRepo.getTenantMemberAttributes(result.tenantId)

          // All segments processed, push the segment related docs into syncStream
          syncStream.push(
            ...memberSegmentCouples[memberId].map((s) => {
              return {
                id: `${s.data.id}-${s.aggregates.segmentId}`,
                body: MemberSyncService.prefixData(s.data, s.aggregates, attributes),
              }
            }),
          )

          const isMultiSegment = this.serviceConfig.edition === Edition.LFX

          if (isMultiSegment) {
            // also calculate and push for parent and grandparent segments
            const childSegmentIds: string[] = distinct(memberSegments.map((m) => m.segmentId))
            const segmentInfos = await this.segmentRepo.getParentSegmentIds(childSegmentIds)

            const parentIds: string[] = distinct(segmentInfos.map((s) => s.parentId))
            for (const parentId of parentIds) {
              const aggregated = MemberSyncService.aggregateData(
                memberSegmentCouples[memberId].map((s) => s.aggregates),
                segmentInfos,
                parentId,
              )
              const prepared = MemberSyncService.prefixData(
                memberSegmentCouples[memberId][0].data,
                aggregated,
                attributes,
              )
              syncStream.push({
                id: `${memberId}-${parentId}`,
                body: prepared,
              })
            }

            const grandParentIds = distinct(segmentInfos.map((s) => s.grandParentId))
            for (const grandParentId of grandParentIds) {
              const aggregated = MemberSyncService.aggregateData(
                memberSegmentCouples[memberId].map((s) => s.aggregates),
                segmentInfos,
                undefined,
                grandParentId,
              )
              const prepared = MemberSyncService.prefixData(
                {
                  ...memberSegmentCouples[memberId][0].data,
                  grandParentSegment: true,
                },
                aggregated,
                attributes,
              )
              syncStream.push({
                id: `${memberId}-${grandParentId}`,
                body: prepared,
              })
            }
          }

          // delete the memberId from matrix, we already created syncStreams for indexing to opensearch
          delete memberSegmentCouples[memberId]
        }

        index += 1
      }
    }

    for (let i = 0; i < totalMemberIds; i++) {
      const memberId = allMemberIds[i]
      const totalSegments = memberSegmentCouples[memberId].length

      for (let j = 0; j < totalSegments; j++) {
        const segment = memberSegmentCouples[memberId][j]
        databaseStream.push({
          memberId: memberId,
          segmentId: segment.segmentId,
          memberDataPromise: this.memberRepo.getMemberData(memberId),
          aggregatesPromise: getMemberAggregates(this.qdbStore.connection(), memberId, [
            segment.segmentId,
          ]),
        })

        // databaseStreams will create syncStreams items in processSegmentsStream, which'll later be used to sync to opensearch in bulk
        const isLastSegment = i === totalMemberIds - 1 && j === totalSegments - 1

        if (isLastSegment || databaseStream.length >= CONCURRENT_DATABASE_QUERIES) {
          await processSegmentsStream(databaseStream)
          databaseStream = []
        }

        while (syncStream.length >= BULK_INDEX_DOCUMENT_BATCH_SIZE) {
          await this.openSearchService.bulkIndex(
            OpenSearchIndex.MEMBERS,
            syncStream.slice(0, BULK_INDEX_DOCUMENT_BATCH_SIZE),
          )
          documentsIndexed += syncStream.slice(0, BULK_INDEX_DOCUMENT_BATCH_SIZE).length
          syncStream = syncStream.slice(BULK_INDEX_DOCUMENT_BATCH_SIZE)
        }

        // check if there are remaining syncStreams to process
        if (isLastSegment && syncStream.length > 0) {
          await this.openSearchService.bulkIndex(OpenSearchIndex.MEMBERS, syncStream)
          documentsIndexed += syncStream.length
        }
        successfullySyncedMembers.push(memberId)
      }
    }

    return {
      membersSynced: memberIds.length,
      documentsIndexed,
    }
  }

  private static aggregateData(
    aggregates: IMemberSegmentAggregates[],
    segmentInfos: IDbSegmentInfo[],
    parentId?: string,
    grandParentId?: string,
  ): IMemberSegmentAggregates | undefined {
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

    const relevantAggregates = aggregates.filter((m) => relevantSubchildIds.includes(m.segmentId))

    if (relevantAggregates.length === 0) {
      throw new Error('No members found for given parent or grandParent segment id!')
    }

    // aggregate data
    const data: IMemberSegmentAggregates = {
      memberId: relevantAggregates[0].memberId,
      segmentId: parentId !== undefined ? parentId : grandParentId,
      activeOn: [],
      activityCount: 0,
      activityTypes: [],
      activeDaysCount: 0,
      lastActive: undefined,
      averageSentiment: null,
    }

    for (const agg of relevantAggregates) {
      data.activeOn.push(...(agg.activeOn || []))
      data.activityCount += agg.activityCount
      data.activityTypes.push(...(agg.activityTypes || []))
      data.activeDaysCount += agg.activeDaysCount
      if (!data.lastActive) {
        data.lastActive = agg.lastActive
      } else if (agg.lastActive) {
        const d1 = new Date(data.lastActive)
        const d2 = new Date(agg.lastActive)

        if (d1 < d2) {
          data.lastActive = agg.lastActive
        }
      }
      if (!data.averageSentiment) {
        data.averageSentiment = agg.averageSentiment
      } else if (agg.averageSentiment) {
        data.averageSentiment += agg.averageSentiment
      }
    }

    // average sentiment with the total number of members that have sentiment set
    if (data.averageSentiment) {
      data.averageSentiment = Number(
        (
          data.averageSentiment /
          relevantAggregates.filter((m) => m.averageSentiment !== null).length
        ).toFixed(2),
      )
    }

    // gather only uniques
    data.activeOn = distinct(data.activeOn)
    data.activityTypes = distinct(data.activityTypes)

    return data
  }

  public static prefixData(
    data: IDbMemberSyncData,
    aggregates: IMemberSegmentAggregates,
    attributes: IMemberAttribute[],
  ): any {
    const p: Record<string, unknown> = {}

    p.uuid_memberId = data.id
    p.uuid_tenantId = data.tenantId
    p.uuid_segmentId = aggregates.segmentId
    p.bool_grandParentSegment = data.grandParentSegment ? data.grandParentSegment : false
    p.string_displayName = data.displayName
    p.keyword_displayName = data.displayName
    const p_attributes = {}

    for (const attribute of attributes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attData = data.attributes as any

      if (attribute.name in attData) {
        if (attribute.type === MemberAttributeType.SPECIAL) {
          let data = JSON.stringify(attData[attribute.name])
          data = trimUtf8ToMaxByteLength(data, MemberSyncService.MAX_BYTE_LENGTH)
          p_attributes[`string_${attribute.name}`] = data
        } else {
          const p_data = {}
          const defValue = attData[attribute.name].default
          const prefix = this.attributeTypeToOpenSearchPrefix(defValue, attribute.type)

          for (const key of Object.keys(attData[attribute.name])) {
            let value = attData[attribute.name][key]
            if (attribute.type === MemberAttributeType.STRING) {
              value = trimUtf8ToMaxByteLength(value, MemberSyncService.MAX_BYTE_LENGTH)
            }
            p_data[`${prefix}_${key}`] = value
          }

          p_attributes[`obj_${attribute.name}`] = p_data
        }
      }
    }

    // If the 'reach' data from the database is a number instead of an object,
    // we convert it into an object with a 'total' property holding the original number.
    p.obj_reach = typeof data.reach === 'object' ? data.reach : { total: data.reach }

    p.obj_attributes = p_attributes
    p.int_score = data.score
    p.date_lastEnriched = data.lastEnriched ? new Date(data.lastEnriched).toISOString() : null
    p.date_joinedAt = new Date(data.joinedAt).toISOString()
    p.date_createdAt = new Date(data.createdAt).toISOString()
    p.bool_manuallyCreated = data.manuallyCreated ? data.manuallyCreated : false
    p.int_numberOfOpenSourceContributions = data.numberOfOpenSourceContributions
    p.string_arr_activeOn = aggregates.activeOn
    p.int_activityCount = aggregates.activityCount
    p.string_arr_activityTypes = aggregates.activityTypes
    p.int_activeDaysCount = aggregates.activeDaysCount
    p.date_lastActive = aggregates.lastActive ? new Date(aggregates.lastActive).toISOString() : null
    p.float_averageSentiment = aggregates.averageSentiment

    const p_identities = []
    for (const identity of data.identities) {
      p_identities.push({
        string_platform: identity.platform,
        string_value: identity.value,
        keyword_value: identity.value,
        keyword_type: identity.type,
        bool_verified: identity.verified,
        keyword_sourceId: identity.sourceId,
        keyword_integrationId: identity.integrationId,
      })
    }
    p.nested_identities = p_identities

    p.string_arr_verifiedEmails = distinct(
      data.identities
        .filter((i) => i.verified && i.type === MemberIdentityType.EMAIL)
        .map((i) => i.value),
    )
    p.keyword_verifiedEmails = p.string_arr_verifiedEmails

    p.string_arr_unverifiedEmails = distinct(
      data.identities
        .filter((i) => !i.verified && i.type === MemberIdentityType.EMAIL)
        .map((i) => i.value),
    )
    p.keyword_unverifiedEmails = p.string_arr_unverifiedEmails

    p.string_arr_verifiedUsernames = distinct(
      data.identities
        .filter((i) => i.verified && i.type === MemberIdentityType.USERNAME)
        .map((i) => i.value),
    )
    p.keyword_verifiedUsernames = p.string_arr_verifiedUsernames

    p.string_arr_unverifiedUsernames = distinct(
      data.identities
        .filter((i) => !i.verified && i.type === MemberIdentityType.USERNAME)
        .map((i) => i.value),
    )
    p.keyword_unverifiedUsernames = p.string_arr_unverifiedUsernames

    p.string_arr_identityPlatforms = distinct(
      data.identities.filter((i) => i.verified).map((i) => i.platform),
    )

    const p_contributions = []
    if (data.contributions) {
      for (const contribution of data.contributions) {
        p_contributions.push({
          uuid_id: contribution.id,
          string_url: contribution.url,
          string_summary: contribution.summary,
          int_numberCommits: contribution.numberCommits,
          date_lastCommitDate: new Date(contribution.lastCommitDate).toISOString(),
          date_firstCommitDate: new Date(contribution.firstCommitDate).toISOString(),
        })
      }
    }

    const p_affiliations = []
    for (const affiliation of data.affiliations) {
      p_affiliations.push({
        uuid_id: affiliation.id,
        string_segmentId: affiliation.segmentId,
        string_segmentSlug: affiliation.segmentSlug,
        string_segmentName: affiliation.segmentName,
        string_segmentParentName: affiliation.segmentParentName,
        string_organizationId: affiliation.organizationId,
        string_organizationName: affiliation.organizationName,
        string_organizationLogo: affiliation.organizationLogo,
        date_dateStart: affiliation.dateStart
          ? new Date(affiliation.dateStart).toISOString()
          : null,
        date_dateEnd: affiliation.dateEnd ? new Date(affiliation.dateEnd).toISOString() : null,
      })
    }

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
          string_source: organization.memberOrganizations?.source || null,
        },
      })
    }
    p.nested_organizations = p_organizations

    const p_tags = []
    for (const tag of data.tags) {
      p_tags.push({
        uuid_id: tag.id,
        string_name: tag.name,
      })
    }

    const p_notes = []
    for (const note of data.notes) {
      p_notes.push({
        uuid_id: note.id,
        string_body: note.body,
      })
    }

    const p_tasks = []
    for (const task of data.tasks) {
      p_tasks.push({
        uuid_id: task.id,
        string_name: task.name,
        string_body: task.body,
        string_status: task.status,
        date_dueDate: task.dueDate,
        string_type: task.type,
      })
    }

    p.nested_contributions = p_contributions
    p.nested_affiliations = p_affiliations
    p.nested_tags = p_tags
    p.nested_notes = p_notes
    p.nested_tasks = p_tasks

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
