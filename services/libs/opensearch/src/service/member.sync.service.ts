import { trimUtf8ToMaxByteLength } from '@crowd/common'
import {
  fetchMemberIdentities,
  fetchMemberOrganizations,
  filterMembersWithActivities,
  findMemberById,
  MemberField,
} from '@crowd/data-access-layer'
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
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { repoQx, QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { getMemberAggregates } from '@crowd/data-access-layer/src/activities'
import {
  cleanupMemberAggregates,
  fetchAbsoluteMemberAggregates,
  insertMemberSegments,
} from '@crowd/data-access-layer/src/members/segments'
import { OrganizationField, findOrgById } from '@crowd/data-access-layer/src/orgs'
import { IMemberSegmentAggregates } from '@crowd/data-access-layer/src/members/types'

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
    private readonly qdbStore: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    this.log = getChildLogger('member-sync-service', parentLog)

    this.memberRepo = new MemberRepository(redisClient, pgStore, this.log)
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
      memberIds = await loadNextPage(memberIds[memberIds.length - 1])
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
        memberData = await logExecutionTimeV2(
          async () => getMemberAggregates(this.qdbStore.connection(), memberId),
          this.log,
          'getMemberAggregates',
        )
      } catch (e) {
        this.log.error(e, 'Failed to get organization aggregates!')
        throw e
      }

      try {
        await logExecutionTimeV2(
          async () =>
            this.memberRepo.transactionally(
              async (txRepo) => {
                const qx = repoQx(txRepo)
                if (memberData.length > 0) {
                  await cleanupMemberAggregates(qx, memberId)
                  await insertMemberSegments(qx, memberData)
                }
              },
              undefined,
              true,
            ),
          this.log,
          'insertMemberSegments',
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

      return {
        membersSynced: 1,
        documentsIndexed,
      }
    }

    const syncResults = await syncMemberAggregates(memberId)

    const syncMembersToOpensearchForMergeSuggestions = async (memberId) => {
      const qx = repoQx(this.memberRepo)
      const base = await findMemberById(qx, memberId, [
        MemberField.ID,
        MemberField.TENANT_ID,
        MemberField.DISPLAY_NAME,
        MemberField.ATTRIBUTES,
      ])
      const attributes = await this.memberRepo.getTenantMemberAttributes(base.tenantId)
      const data = await buildFullMemberForMergeSuggestions(qx, base)
      const prefixed = MemberSyncService.prefixData(data, attributes)
      await this.openSearchService.index(memberId, OpenSearchIndex.MEMBERS, prefixed)
    }
    await logExecutionTimeV2(
      async () => syncMembersToOpensearchForMergeSuggestions(memberId),
      this.log,
      'syncMembersToOpensearchForMergeSuggestions',
    )

    return syncResults
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static prefixData(
    data: IMemberWithAggregatesForMergeSuggestions,
    attributes: IMemberAttribute[],
  ): IMemberOpensearch {
    const p: IMemberOpensearch = {} as IMemberOpensearch

    p.uuid_memberId = data.id
    p.uuid_tenantId = data.tenantId
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
}
