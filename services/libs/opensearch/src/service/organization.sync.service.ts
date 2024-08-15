import { getOrgAggregates } from '@crowd/data-access-layer/src/activities'
import {
  IDbOrganizationAggregateData,
  cleanupForOganization,
  insertOrganizationSegments,
} from '@crowd/data-access-layer/src/organizations'
import { OrganizationField, findOrgById } from '@crowd/data-access-layer/src/orgs'
import { repoQx, QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { fetchOrgIdentities } from '@crowd/data-access-layer/src/organizations/identities'
import { findOrgAttributes } from '@crowd/data-access-layer/src/organizations/attributes'
import { findOrgNoMergeIds } from '@crowd/data-access-layer/src/org_merge'
import { fetchTotalActivityCount } from '@crowd/data-access-layer/src/organizations/segments'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger, logExecutionTime } from '@crowd/logging'
import {
  IOrganizationBaseForMergeSuggestions,
  IOrganizationOpensearch,
  IOrganizationFullAggregatesOpensearch,
  OpenSearchIndex,
  OrganizationIdentityType,
  SegmentType,
} from '@crowd/types'
import { IndexedEntityType } from '../repo/indexing.data'
import { IndexingRepository } from '../repo/indexing.repo'
import { OrganizationRepository } from '../repo/organization.repo'
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IOrganizationSyncResult } from './organization.sync.data'

export async function buildFullOrgForMergeSuggestions(
  qx: QueryExecutor,
  organization: IOrganizationBaseForMergeSuggestions,
): Promise<IOrganizationFullAggregatesOpensearch> {
  const identities = await fetchOrgIdentities(qx, organization.id)
  const attributes = await findOrgAttributes(qx, organization.id)
  const totalActivityCount = await fetchTotalActivityCount(qx, organization.id)
  const noMergeIds = await findOrgNoMergeIds(qx, organization.id)

  return {
    ...organization,
    ticker: attributes.find((a) => a.name === 'ticker' && a.default)?.value,
    identities,
    activityCount: totalActivityCount,
    noMergeIds,
    website: identities.find((i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN)?.value,
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export class OrganizationSyncService {
  private log: Logger
  private readonly orgRepo: OrganizationRepository
  private readonly indexingRepo: IndexingRepository

  constructor(
    writeStore: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
    readStore?: DbStore,
  ) {
    this.log = getChildLogger('organization-sync-service', parentLog)

    const store = readStore || writeStore
    this.orgRepo = new OrganizationRepository(store, this.log)
    this.indexingRepo = new IndexingRepository(writeStore, this.log)
  }

  public async getAllIndexedTenantIds(
    pageSize = 500,
    afterKey?: string,
  ): Promise<IPagedSearchResponse<string, string>> {
    const include = ['uuid_tenantId']

    const results = await this.openSearchService.search(
      OpenSearchIndex.ORGANIZATIONS,
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

  public async cleanupOrganizationIndex(tenantId: string, batchSize = 300): Promise<void> {
    this.log.warn({ tenantId }, 'Cleaning up organization index!')

    const query = {
      bool: {
        filter: {
          term: {
            uuid_tenantId: tenantId,
          },
        },
      },
    }

    const sort = [{ date_createdAt: 'asc' }]
    const include = ['date_createdAt', 'uuid_organizationId']
    const pageSize = 500
    let lastCreatedAt: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.ORGANIZATIONS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ date_createdAt: string; uuid_organizationId: string }>[]

    let processed = 0
    const idsToRemove: string[] = []

    while (results.length > 0) {
      // check every organization if they exists in the database and if not remove them from the index
      const dbIds = await this.orgRepo.checkOrganizationsExists(
        tenantId,
        results.map((r) => r._source.uuid_organizationId),
      )

      const toRemove = results
        .filter((r) => !dbIds.includes(r._source.uuid_organizationId))
        .map((r) => r._id)

      idsToRemove.push(...toRemove)

      // Process bulk removals in chunks
      while (idsToRemove.length >= batchSize) {
        const batch = idsToRemove.splice(0, batchSize)
        this.log.warn({ tenantId, batch }, 'Removing organizations from index!')
        await this.openSearchService.bulkRemoveFromIndex(batch, OpenSearchIndex.ORGANIZATIONS)
      }

      processed += results.length
      this.log.warn({ tenantId }, `Processed ${processed} organizations while cleaning up tenant!`)

      // use last createdAt to get the next page
      lastCreatedAt = results[results.length - 1]._source.date_createdAt
      results = (await this.openSearchService.search(
        OpenSearchIndex.ORGANIZATIONS,
        query,
        undefined,
        pageSize,
        sort,
        lastCreatedAt,
        include,
      )) as ISearchHit<{ date_createdAt: string; uuid_organizationId: string }>[]
    }

    // Remove any remaining IDs that were not processed
    if (idsToRemove.length > 0) {
      this.log.warn({ tenantId, idsToRemove }, 'Removing remaining organizations from index!')
      await this.openSearchService.bulkRemoveFromIndex(idsToRemove, OpenSearchIndex.ORGANIZATIONS)
    }

    this.log.warn(
      { tenantId },
      `Processed total of ${processed} organizations while cleaning up tenant!`,
    )
  }

  public async removeOrganization(organizationId: string): Promise<void> {
    this.log.debug({ organizationId }, 'Removing organization from index!')

    const query = {
      bool: {
        filter: {
          term: {
            uuid_organizationId: organizationId,
          },
        },
      },
    }

    const sort = [{ date_joinedAt: 'asc' }]
    const include = ['date_joinedAt']
    const pageSize = 10
    let lastJoinedAt: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.ORGANIZATIONS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ date_joinedAt: string }>[]

    while (results.length > 0) {
      const ids = results.map((r) => r._id)
      await this.openSearchService.bulkRemoveFromIndex(ids, OpenSearchIndex.ORGANIZATIONS)

      // use last joinedAt to get the next page
      lastJoinedAt = results[results.length - 1]._source.date_joinedAt
      results = (await this.openSearchService.search(
        OpenSearchIndex.ORGANIZATIONS,
        query,
        undefined,
        pageSize,
        sort,
        lastJoinedAt,
        include,
      )) as ISearchHit<{ date_joinedAt: string }>[]
    }
  }

  public async syncTenantOrganizations(tenantId: string, batchSize = 200): Promise<void> {
    this.log.warn({ tenantId }, 'Syncing all tenant organizations!')
    let docCount = 0
    let organizationCount = 0
    let previousBatchIds: string[] = []
    const now = new Date()

    await logExecutionTime(
      async () => {
        let organizationIds = await this.orgRepo.getTenantOrganizationsForSync(
          tenantId,
          batchSize,
          previousBatchIds,
        )

        while (organizationIds.length > 0) {
          const { organizationsSynced, documentsIndexed } = await this.syncOrganizations(
            organizationIds,
            { withAggs: true },
          )

          organizationCount += organizationsSynced
          docCount += documentsIndexed

          const diffInMinutes = (new Date().getTime() - now.getTime()) / 1000 / 60
          this.log.info(
            { tenantId },
            `Synced ${organizationCount} organizations! Speed: ${Math.round(
              organizationCount / diffInMinutes,
            )} organizations/minute!`,
          )

          await this.indexingRepo.markEntitiesIndexed(
            IndexedEntityType.ORGANIZATION,
            organizationIds.map((id) => {
              return {
                id,
                tenantId,
              }
            }),
          )

          previousBatchIds = organizationIds
          organizationIds = await this.orgRepo.getTenantOrganizationsForSync(
            tenantId,
            batchSize,
            previousBatchIds,
          )
        }
      },
      this.log,
      'sync-tenant-organizations',
    )

    this.log.info(
      { tenantId },
      `Synced total of ${organizationCount} organizations with ${docCount} documents!`,
    )
  }

  public async syncOrganizations(
    organizationIds: string[],
    opts: { withAggs?: boolean } = { withAggs: true },
  ): Promise<IOrganizationSyncResult> {
    const syncOrgAggregates = async (organizationIds) => {
      let documentsIndexed = 0
      const organizationIdsToIndex = []
      for (const organizationId of organizationIds) {
        let orgData: IDbOrganizationAggregateData[] = []
        try {
          const qx = repoQx(this.orgRepo)
          for (const type of Object.values(SegmentType)) {
            orgData = orgData.concat(await getOrgAggregates(qx, organizationId, type))
          }
        } catch (e) {
          this.log.error(e, 'Failed to get organization aggregates!')
          throw e
        }

        try {
          await this.orgRepo.transactionally(
            async (txRepo) => {
              const qx = repoQx(txRepo)
              await cleanupForOganization(qx, organizationId)

              if (orgData.length > 0) {
                await insertOrganizationSegments(qx, orgData)
              }
            },
            undefined,
            true,
          )
          organizationIdsToIndex.push(organizationId)
          documentsIndexed += orgData.length
        } catch (e) {
          this.log.error(e, 'Failed to insert organization aggregates!')
          throw e
        }
      }

      return {
        organizationsSynced: organizationIds.length,
        documentsIndexed,
        organizationIdsToIndex,
      }
    }

    const syncResults = opts.withAggs
      ? await syncOrgAggregates(organizationIds)
      : {
          organizationsSynced: 0,
          documentsIndexed: 0,
          organizationIdsToIndex: organizationIds,
        }

    const syncOrgsToOpensearchForMergeSuggestions = async (organizationIds) => {
      for (const orgId of organizationIds) {
        const qx = repoQx(this.orgRepo)
        const base = await findOrgById(qx, orgId, [
          OrganizationField.ID,
          OrganizationField.TENANT_ID,
          OrganizationField.DISPLAY_NAME,
          OrganizationField.LOCATION,
          OrganizationField.INDUSTRY,
        ])
        const data = await buildFullOrgForMergeSuggestions(qx, base)
        const prefixed = OrganizationSyncService.prefixData(data)
        await this.openSearchService.index(orgId, OpenSearchIndex.ORGANIZATIONS, prefixed)
      }
    }
    await syncOrgsToOpensearchForMergeSuggestions(syncResults.organizationIdsToIndex)

    return syncResults
  }

  public static async prefixData(
    data: IOrganizationFullAggregatesOpensearch,
  ): Promise<IOrganizationOpensearch> {
    return {
      uuid_organizationId: data.id,
      uuid_tenantId: data.tenantId,
      string_location: data.location,
      string_industry: data.industry,
      string_ticker: data.ticker,
      keyword_displayName: data.displayName,
      string_website: data.website,

      nested_identities: data.identities.map((identity) => ({
        string_platform: identity.platform,
        string_value: identity.value,
        keyword_type: identity.type,
        string_type: identity.type,
        bool_verified: identity.verified,
      })),

      int_activityCount: data.activityCount,
    }
  }
}
