import { DEFAULT_TENANT_ID, distinct, trimUtf8ToMaxByteLength } from '@crowd/common'
import {
  MemberField,
  fetchMemberIdentities,
  fetchMemberOrganizations,
  filterMembersWithActivityRelations,
  findMemberById,
  getMemberActivityCoreAggregates,
} from '@crowd/data-access-layer'
import { OrganizationField, findOrgById } from '@crowd/data-access-layer'
import {
  cleanupMemberAggregates,
  fetchAbsoluteMemberAggregates,
  findLastSyncDate,
  insertMemberSegmentAggregates,
} from '@crowd/data-access-layer/src/members/segments'
import { IMemberSegmentCoreAggregates } from '@crowd/data-access-layer/src/members/types'
import { QueryExecutor, repoQx } from '@crowd/data-access-layer/src/queryExecutor'
import { fetchManySegments } from '@crowd/data-access-layer/src/segments'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger, logExecutionTimeV2 } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  IMemberAttribute,
  IMemberBaseForMergeSuggestions,
  IMemberOpensearch,
  IMemberOrganization,
  IMemberWithAggregatesForMergeSuggestions,
  MemberAttributeType,
} from '@crowd/types'

import { IndexedEntityType } from '../repo/indexing.data'
import { IndexingRepository } from '../repo/indexing.repo'
import { MemberRepository } from '../repo/member.repo'
import { OpenSearchIndex } from '../types'

import { IMemberSyncResult } from './member.sync.data'
import { ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function buildFullMemberForMergeSuggestions(
  qx: QueryExecutor,
  member: IMemberBaseForMergeSuggestions,
): Promise<IMemberWithAggregatesForMergeSuggestions> {
  const identities = await fetchMemberIdentities(qx, member.id)
  const absoluteAggregates = await fetchAbsoluteMemberAggregates(qx, member.id)
  const roles = await fetchMemberOrganizations(qx, member.id)

  const rolesWithDisplayName: IMemberOrganization[] = []

  for (const role of roles) {
    const organization = await findOrgById(qx, role.organizationId, [
      OrganizationField.ID,
      OrganizationField.DISPLAY_NAME,
    ])

    rolesWithDisplayName.push({
      ...role,
      displayName: organization.displayName,
    })
  }

  return {
    ...member,
    identities,
    activityCount: absoluteAggregates.activityCount,
    organizations: rolesWithDisplayName,
  }
}

export class MemberSyncService {
  private static MAX_BYTE_LENGTH = 25000
  private log: Logger
  private readonly memberRepo: MemberRepository
  private readonly indexingRepo: IndexingRepository

  constructor(
    redisClient: RedisClient,
    pgStore: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    this.log = getChildLogger('member-sync-service', parentLog)

    this.memberRepo = new MemberRepository(redisClient, pgStore, this.log)
    this.indexingRepo = new IndexingRepository(pgStore, this.log)
  }

  public async cleanupMemberIndex(batchSize = 300): Promise<void> {
    this.log.warn('Cleaning up member index!')

    const query = {
      bool: {
        filter: {
          term: {
            uuid_tenantId: DEFAULT_TENANT_ID,
          },
        },
      },
    }

    const sort = [{ _id: 'asc' }]
    const include = ['uuid_memberId']
    const pageSize = 500
    let lastId: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.MEMBERS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ uuid_memberId: string }>[]

    let processed = 0
    const idsToRemove: string[] = []

    while (results.length > 0) {
      // check every member if they exists in the database and if not remove them from the index
      const memberData = await this.memberRepo.checkMembersExists(
        results.map((r) => r._source.uuid_memberId),
      )

      const membersWithActivities = await filterMembersWithActivityRelations(
        repoQx(this.memberRepo),
        memberData.map((m) => m.memberId),
      )

      const ids = memberData
        .filter((m) => m.manuallyCreated || membersWithActivities.includes(m.memberId))
        .map((m) => m.memberId)

      const toRemove = results
        .filter((r) => !ids.includes(r._source.uuid_memberId))
        .map((r) => r._id)

      idsToRemove.push(...toRemove)

      // Process bulk removals in chunks
      while (idsToRemove.length >= batchSize) {
        const batch = idsToRemove.splice(0, batchSize)
        this.log.warn({ batch }, 'Removing members from index!')
        await this.openSearchService.bulkRemoveFromIndex(batch, OpenSearchIndex.MEMBERS)
      }

      processed += results.length
      this.log.warn(`Processed ${processed} members while cleaning up!`)

      lastId = results[results.length - 1]._id
      results = (await this.openSearchService.search(
        OpenSearchIndex.MEMBERS,
        query,
        undefined,
        pageSize,
        sort,
        lastId,
        include,
      )) as ISearchHit<{ uuid_memberId: string }>[]
    }

    // Remove any remaining IDs that were not processed
    if (idsToRemove.length > 0) {
      this.log.warn({ idsToRemove }, 'Removing remaining members from index!')
      await this.openSearchService.bulkRemoveFromIndex(idsToRemove, OpenSearchIndex.MEMBERS)
    }

    this.log.warn(`Processed total of ${processed} members while cleaning up!`)
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

    const sort = [{ _id: 'asc' }]
    const pageSize = 10
    let lastId: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.MEMBERS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      undefined,
    )) as ISearchHit<object>[]

    while (results.length > 0) {
      const ids = results.map((r) => r._id)
      await this.openSearchService.bulkRemoveFromIndex(ids, OpenSearchIndex.MEMBERS)

      lastId = results[results.length - 1]._id
      results = (await this.openSearchService.search(
        OpenSearchIndex.MEMBERS,
        query,
        undefined,
        pageSize,
        sort,
        lastId,
        undefined,
      )) as ISearchHit<object>[]
    }
  }

  public async syncOrganizationMembers(
    organizationId: string,
    opts: { syncFrom: Date | null } = { syncFrom: null },
  ): Promise<void> {
    this.log.debug({ organizationId }, 'Syncing all organization members!')
    const batchSize = 500
    let docCount = 0
    let memberCount = 0

    const now = new Date()

    const loadNextPage = async (lastId?: string): Promise<string[]> => {
      this.log.info('Loading next page of organization members!', { organizationId, lastId })
      const memberIds = await logExecutionTimeV2(
        () =>
          this.memberRepo.getOrganizationMembersForSync(
            organizationId,
            batchSize,
            lastId,
            opts.syncFrom,
          ),
        this.log,
        `getOrganizationMembersForSync`,
      )

      if (memberIds.length === 0) {
        return []
      }

      return memberIds
    }

    let memberIds: string[] = await loadNextPage()

    while (memberIds.length > 0) {
      for (let i = 0; i < memberIds.length; i++) {
        const memberId = memberIds[i]
        const { membersSynced, documentsIndexed } = await logExecutionTimeV2(
          () => this.syncMembers(memberId, { withAggs: true, syncFrom: opts.syncFrom }),
          this.log,
          `syncMembers (${i}/${memberIds.length})`,
        )

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
      memberIds = await loadNextPage(memberIds[memberIds.length - 1])
    }

    this.log.info(
      { organizationId },
      `Synced total of ${memberCount} members with ${docCount} documents!`,
    )
  }

  public async syncMembers(
    memberId: string,
    opts: { withAggs?: boolean; syncFrom?: Date } = { withAggs: true },
  ): Promise<IMemberSyncResult> {
    const qx = repoQx(this.memberRepo)

    const syncMemberAggregates = async (memberId) => {
      if (opts.syncFrom) {
        const lastSyncDate = await findLastSyncDate(qx, memberId)
        if (lastSyncDate && lastSyncDate.getTime() > opts.syncFrom.getTime()) {
          this.log.info(
            `Skipping sync of member aggregates as last sync date is greater than syncFrom!`,
            { memberId, lastSyncDate, syncFrom: opts.syncFrom },
          )
          return
        }
      }

      let documentsIndexed = 0
      let memberData: IMemberSegmentCoreAggregates[]

      try {
        memberData = await logExecutionTimeV2(
          () => getMemberActivityCoreAggregates(qx, memberId),
          this.log,
          'getMemberActivityCoreAggregates',
        )

        // get segment data to aggregate for projects and project groups
        const subprojectSegmentIds = memberData.map((m) => m.segmentId)
        const segmentData = await logExecutionTimeV2(
          () => fetchManySegments(qx, subprojectSegmentIds),
          this.log,
          'fetchManySegments',
        )

        if (segmentData.find((s) => s.type !== 'subproject')) {
          throw new Error('Only subprojects should be set to activities.segmentId!')
        }

        // aggregate data for projects
        const projectSegmentIds = distinct(segmentData.map((s) => s.parentId))
        for (const projectSegmentId of projectSegmentIds) {
          const subprojects = segmentData.filter((s) => s.parentId === projectSegmentId)
          const filtered: IMemberSegmentCoreAggregates[] = []
          for (const subproject of subprojects) {
            filtered.push(...memberData.filter((m) => m.segmentId === subproject.id))
          }

          const aggregated = MemberSyncService.aggregateData(projectSegmentId, filtered)
          memberData.push(aggregated)
        }

        // aggregate data for project groups
        const projectGroupSegmentIds = distinct(segmentData.map((s) => s.grandparentId))
        for (const projectGroupSegmentId of projectGroupSegmentIds) {
          const subprojects = segmentData.filter((s) => s.grandparentId === projectGroupSegmentId)
          const filtered: IMemberSegmentCoreAggregates[] = []
          for (const subproject of subprojects) {
            filtered.push(...memberData.filter((m) => m.segmentId === subproject.id))
          }

          const aggregated = MemberSyncService.aggregateData(projectGroupSegmentId, filtered)
          memberData.push(aggregated)
        }
      } catch (e) {
        this.log.error(e, 'Failed to get organization aggregates!')
        throw e
      }

      if (memberData.length === 0) {
        this.log.info({ memberId }, 'No aggregates found for member - cleaning up old data!')
        await cleanupMemberAggregates(qx, memberId)
      } else {
        try {
          await this.memberRepo.transactionally(
            async (txRepo) => {
              const qx = repoQx(txRepo)
              await logExecutionTimeV2(
                () => cleanupMemberAggregates(qx, memberId),
                this.log,
                'cleanupMemberAggregates',
              )
              await logExecutionTimeV2(
                () =>
                  insertMemberSegmentAggregates(
                    qx,
                    memberData.map((m) => ({
                      ...m,
                      // Default values for non-nullable fields in the table.
                      // These columns are computed async later, so we set placeholders.
                      lastActive: '1970-01-01',
                      activityTypes: [],
                      averageSentiment: null,
                      activeDaysCount: 0,
                    })),
                  ),
                this.log,
                'insertMemberCoreAggregates',
              )
            },
            undefined,
            true,
          )

          documentsIndexed += memberData.length
          this.log.info(
            { memberId, total: documentsIndexed },
            `Synced ${memberData.length} member aggregates!`,
          )
        } catch (e) {
          this.log.error(e, 'Failed to insert member aggregates!')
          throw e
        }
      }

      return {
        membersSynced: 1,
        documentsIndexed,
      }
    }

    const syncResults = opts.withAggs
      ? await syncMemberAggregates(memberId)
      : {
          membersSynced: 0,
          documentsIndexed: 0,
        }

    const syncMembersToOpensearchForMergeSuggestions = async (memberId) => {
      const qx = repoQx(this.memberRepo)
      const base = await findMemberById(qx, memberId, [
        MemberField.ID,
        MemberField.DISPLAY_NAME,
        MemberField.ATTRIBUTES,
      ])

      if (!base) {
        return
      }

      const attributes = await this.memberRepo.getMemberAttributes()
      const data = await buildFullMemberForMergeSuggestions(qx, base)
      const prefixed = MemberSyncService.prefixData(data, attributes)
      await this.openSearchService.index(memberId, OpenSearchIndex.MEMBERS, prefixed)
    }

    await syncMembersToOpensearchForMergeSuggestions(memberId)
    await this.indexingRepo.markEntitiesIndexed(IndexedEntityType.MEMBER, [memberId])

    if (syncResults) {
      return syncResults
    }

    return {
      membersSynced: 0,
      documentsIndexed: 0,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static prefixData(
    data: IMemberWithAggregatesForMergeSuggestions,
    attributes: IMemberAttribute[],
  ): IMemberOpensearch {
    const p: IMemberOpensearch = {} as IMemberOpensearch

    p.uuid_memberId = data.id
    p.uuid_tenantId = DEFAULT_TENANT_ID
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

    p.obj_attributes = p_attributes
    p.int_activityCount = data.activityCount

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

    const p_organizations = []
    for (const organization of data.organizations) {
      p_organizations.push({
        uuid_id: organization.id,
        string_displayName: organization.displayName,
        obj_memberOrganizations: {
          string_title: organization?.title || null,
          date_dateStart: organization?.dateStart || null,
          date_dateEnd: organization?.dateEnd || null,
          string_source: organization?.source || null,
        },
      })
    }
    p.nested_organizations = p_organizations

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

  private static aggregateData(
    segmentId: string,
    input: IMemberSegmentCoreAggregates[],
  ): IMemberSegmentCoreAggregates {
    const activityCount = input.reduce((sum, data) => sum + data.activityCount, 0)
    const activeOn = [...new Set(input.flatMap((data) => data.activeOn))]

    return {
      segmentId,
      memberId: input[0].memberId,

      activityCount,
      activeOn,
    }
  }
}
