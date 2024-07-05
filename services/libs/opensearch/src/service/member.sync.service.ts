import { distinct, trimUtf8ToMaxByteLength } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { IMemberAttribute, MemberAttributeType, MemberIdentityType } from '@crowd/types'
import { IndexedEntityType } from '../repo/indexing.data'
import { IndexingRepository } from '../repo/indexing.repo'
import { IDbMemberSyncData } from '../repo/member.data'
import { MemberRepository } from '../repo/member.repo'
import { SegmentRepository } from '../repo/segment.repo'
import { OpenSearchIndex } from '../types'
import { IMemberSyncResult } from './member.sync.data'
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { repoQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getMemberAggregates } from '@crowd/data-access-layer/src/activities'
import {
  cleanupMemberAggregates,
  insertMemberSegments,
} from '@crowd/data-access-layer/src/members/segments'
import { IMemberSegmentAggregates } from '@crowd/data-access-layer/src/members/types'

export class MemberSyncService {
  private static MAX_BYTE_LENGTH = 25000
  private log: Logger
  private readonly memberRepo: MemberRepository
  private readonly segmentRepo: SegmentRepository
  private readonly indexingRepo: IndexingRepository

  constructor(
    redisClient: RedisClient,
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    this.log = getChildLogger('member-sync-service', parentLog)

    this.memberRepo = new MemberRepository(redisClient, store, this.log)
    this.segmentRepo = new SegmentRepository(store, this.log)
    this.indexingRepo = new IndexingRepository(store, this.log)
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

  public async cleanupMemberIndex(tenantId: string, batchSize = 300): Promise<void> {
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
    const idsToRemove: string[] = []

    while (results.length > 0) {
      // check every member if they exists in the database and if not remove them from the index
      const dbIds = await this.memberRepo.checkMembersExists(
        tenantId,
        results.map((r) => r._source.uuid_memberId),
      )

      const toRemove = results
        .filter((r) => !dbIds.includes(r._source.uuid_memberId))
        .map((r) => r._id)

      idsToRemove.push(...toRemove)

      // Process bulk removals in chunks
      while (idsToRemove.length >= batchSize) {
        const batch = idsToRemove.splice(0, batchSize)
        this.log.warn({ tenantId, batch }, 'Removing members from index!')
        await this.openSearchService.bulkRemoveFromIndex(batch, OpenSearchIndex.MEMBERS)
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

    // Remove any remaining IDs that were not processed
    if (idsToRemove.length > 0) {
      this.log.warn({ tenantId, idsToRemove }, 'Removing remaining members from index!')
      await this.openSearchService.bulkRemoveFromIndex(idsToRemove, OpenSearchIndex.MEMBERS)
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
      await this.openSearchService.bulkRemoveFromIndex(ids, OpenSearchIndex.MEMBERS)

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
      for (const memberId of memberIds) {
        const { membersSynced, documentsIndexed } = await this.syncMembers(memberId)

        docCount += documentsIndexed
        memberCount += membersSynced
      }

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

    let memberIds = await this.memberRepo.getOrganizationMembersForSync(organizationId, batchSize)

    while (memberIds.length > 0) {
      for (const memberId of memberIds) {
        const { membersSynced, documentsIndexed } = await this.syncMembers(memberId)

        docCount += documentsIndexed
        memberCount += membersSynced
      }

      const diffInSeconds = (new Date().getTime() - now.getTime()) / 1000
      this.log.info(
        { organizationId },
        `Synced ${memberCount} members! Speed: ${Math.round(
          memberCount / diffInSeconds,
        )} members/second!`,
      )
      memberIds = await this.memberRepo.getOrganizationMembersForSync(
        organizationId,
        batchSize,
        memberIds[memberIds.length - 1],
      )
    }

    this.log.info(
      { organizationId },
      `Synced total of ${memberCount} members with ${docCount} documents!`,
    )
  }

  public async syncMembers(memberId: string): Promise<IMemberSyncResult> {
    const syncMemberAggregates = async (memberId) => {
      let documentsIndexed = 0
      let memberData: IMemberSegmentAggregates[]
      try {
        const qx = repoQx(this.memberRepo)
        memberData = await getMemberAggregates(qx, memberId)
      } catch (e) {
        this.log.error(e, 'Failed to get organization aggregates!')
        throw e
      }

      try {
        await this.memberRepo.transactionally(
          async (txRepo) => {
            const qx = repoQx(txRepo)
            await cleanupMemberAggregates(qx, memberId)

            if (memberData.length > 0) {
              await insertMemberSegments(qx, memberData)
            }
          },
          undefined,
          true,
        )
        documentsIndexed += memberData.length
      } catch (e) {
        this.log.error(e, 'Failed to insert member aggregates!')
        throw e
      }

      return {
        membersSynced: 1,
        documentsIndexed,
      }
    }

    const syncResults = await syncMemberAggregates(memberId)

    const syncMembersToOpensearchForMergeSuggestions = async (/*memberId*/) => {
      // const qx = repoQx(this.orgRepo)
      // const base = await findOrgById(qx, memberId, {
      //   fields: [
      //     OrganizationField.ID,
      //     OrganizationField.TENANT_ID,
      //     OrganizationField.DISPLAY_NAME,
      //     OrganizationField.LOCATION,
      //     OrganizationField.INDUSTRY,
      //   ],
      // })
      // const data = await buildFullOrgForMergeSuggestions(qx, base)
      // const prefixed = OrganizationSyncService.prefixData(data)
      // await this.openSearchService.index(memberId, OpenSearchIndex.ORGANIZATIONS, prefixed)
    }
    await syncMembersToOpensearchForMergeSuggestions(/* memberId */)

    return syncResults
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static prefixData(data: IDbMemberSyncData, attributes: IMemberAttribute[]): any {
    const p: Record<string, unknown> = {}

    p.uuid_memberId = data.id
    p.uuid_tenantId = data.tenantId
    p.uuid_segmentId = data.segmentId
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
