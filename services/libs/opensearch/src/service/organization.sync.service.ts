import { IDbOrganizationSyncData, IOrganizationSegmentMatrix } from '../repo/organization.data'
import { OrganizationRepository } from '../repo/organization.repo'
import { IDbSegmentInfo } from '../repo/segment.data'
import { SegmentRepository } from '../repo/segment.repo'
import { distinct } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger, logExecutionTime, logExecutionTimeV2 } from '@crowd/logging'
import { OpenSearchIndex } from '@crowd/types'
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IOrganizationSyncResult } from './organization.sync.data'
import { IServiceConfig } from '@crowd/types'
import { IndexingRepository } from '../repo/indexing.repo'
import { IndexedEntityType } from '../repo/indexing.data'
import {
  IOrganizationSegmentAggregates,
  getOrganizationAggregates,
  getOrganizationSegmentCouples,
  getOrgAggregates,
} from '@crowd/data-access-layer'
import {
  cleanupForOganization,
  insertOrganizationSegments,
} from '@crowd/data-access-layer/src/org_segments'
import { repoQx } from '@crowd/data-access-layer/src/queryExecutor'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class OrganizationSyncService {
  private log: Logger
  private readonly orgRepo: OrganizationRepository
  private readonly segmentRepo: SegmentRepository
  private readonly serviceConfig: IServiceConfig
  private readonly indexingRepo: IndexingRepository

  constructor(
    pgStore: DbStore,
    private readonly qdbStore: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
    serviceConfig: IServiceConfig,
  ) {
    this.log = getChildLogger('organization-sync-service', parentLog)
    this.serviceConfig = serviceConfig

    this.orgRepo = new OrganizationRepository(pgStore, this.log)
    this.segmentRepo = new SegmentRepository(pgStore, this.log)
    this.indexingRepo = new IndexingRepository(pgStore, this.log)
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

  public async cleanupOrganizationIndex(tenantId: string): Promise<void> {
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

    while (results.length > 0) {
      // check every organization if they exists in the database and if not remove them from the index
      const dbIds = await this.orgRepo.checkOrganizationsExists(
        tenantId,
        results.map((r) => r._source.uuid_organizationId),
      )

      const toRemove = results
        .filter((r) => !dbIds.includes(r._source.uuid_organizationId))
        .map((r) => r._id)

      if (toRemove.length > 0) {
        this.log.warn({ tenantId, toRemove }, 'Removing organizations from index!')
        for (const id of toRemove) {
          await this.openSearchService.removeFromIndex(id, OpenSearchIndex.ORGANIZATIONS)
        }
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
      for (const id of ids) {
        await this.openSearchService.removeFromIndex(id, OpenSearchIndex.ORGANIZATIONS)
      }

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

  public async syncTenantOrganizations(tenantId: string, batchSize = 100): Promise<void> {
    this.log.warn({ tenantId }, 'Syncing all tenant organizations!')
    let docCount = 0
    let organizationCount = 0

    await logExecutionTime(
      async () => {
        let organizationIds = await this.orgRepo.getTenantOrganizationsForSync(tenantId, batchSize)

        while (organizationIds.length > 0) {
          const { organizationsSynced, documentsIndexed } = await this.syncOrganizations(
            organizationIds,
          )

          organizationCount += organizationsSynced
          docCount += documentsIndexed

          this.log.info(
            { tenantId },
            `Synced ${organizationCount} organizations with ${docCount} documents!`,
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
          organizationIds = await this.orgRepo.getTenantOrganizationsForSync(tenantId, batchSize)
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

  /**
   * Gets segment specific aggregates of an organization and syncs to opensearch
   * Aggregate data is gathered for each segment in separate sql queries
   * Queries are run in paralel with respect to CONCURRENT_DATABASE_QUERIES constant
   * After all segment aggregates of an organization is gathered, we calculate the
   * aggregates for parent segments and push it to syncStream.
   * SyncStream sends documents to opensearch in bulk with respect to BULK_INDEX_DOCUMENT_BATCH_SIZE
   * @param organizationIds organizationIds to be synced to opensearch
   * @returns
   */
  public async syncOrganizations(
    organizationIds: string[],
    segmentIds?: string[],
  ): Promise<IOrganizationSyncResult> {
    let documentsIndexed = 0
    for (const organizationId of organizationIds) {
      let orgData
      try {
        orgData = await logExecutionTimeV2(
          () => getOrgAggregates(this.qdbStore.connection(), organizationId),
          this.log,
          'getOrgAggregates',
        )

        for (const row of orgData) {
          if (!row.segmentId || !row.tenantId || !row.organizationId) {
            console.error('row', row)
            throw new Error('Missing segmentId, tenantId or organizationId in orgData')
          }
        }
      } catch (e) {
        console.error(e)
        throw e
      }

      try {
        await this.orgRepo.transactionally(
          async (txRepo) => {
            const qx = repoQx(txRepo)
            console.log('qx', qx)
            await logExecutionTimeV2(
              () => cleanupForOganization(qx, organizationId),
              this.log,
              'cleanupForOganization',
            )
            await logExecutionTimeV2(
              () => insertOrganizationSegments(qx, orgData),
              this.log,
              'insertOrganizationSegments',
            )
          },
          undefined,
          true,
        )

        documentsIndexed += orgData.length
      } catch (e) {
        console.error(e)
        throw e
      }
    }

    return {
      organizationsSynced: organizationIds.length,
      documentsIndexed,
    }
  }

  private static aggregateData(
    aggregates: IOrganizationSegmentAggregates[],
    segmentInfos: IDbSegmentInfo[],
    parentId?: string,
    grandParentId?: string,
  ): IOrganizationSegmentAggregates | undefined {
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
      throw new Error('No organizations found for given parent or grandParent segment id!')
    }

    // aggregate data
    const data: IOrganizationSegmentAggregates = {
      organizationId: relevantAggregates[0].organizationId,
      segmentId: parentId !== undefined ? parentId : grandParentId,
      joinedAt: undefined,
      lastActive: undefined,
      memberIds: [],
      memberCount: 0,
      activityCount: 0,
      activeOn: [],
    }

    for (const agg of relevantAggregates) {
      if (!data.joinedAt) {
        data.joinedAt = agg.joinedAt
      } else if (agg.joinedAt) {
        const d1 = new Date(data.joinedAt)
        const d2 = new Date(agg.joinedAt)

        if (d1 > d2) {
          data.joinedAt = agg.joinedAt
        }
      }

      if (!data.lastActive) {
        data.lastActive = agg.lastActive
      } else if (agg.lastActive) {
        const d1 = new Date(data.lastActive)
        const d2 = new Date(agg.lastActive)

        if (d1 < d2) {
          data.lastActive = agg.lastActive
        }
      }

      data.activeOn.push(...agg.activeOn)
      data.activityCount += agg.activityCount
      data.memberIds.push(...agg.memberIds)
    }

    // gather only uniques
    data.activeOn = distinct(data.activeOn)
    data.memberCount = distinct(data.memberIds).length

    return data
  }

  public static prefixData(
    data: IDbOrganizationSyncData,
    aggregates: IOrganizationSegmentAggregates,
  ): any {
    const p: Record<string, unknown> = {}

    p.uuid_organizationId = data.organizationId
    p.uuid_segmentId = aggregates.segmentId
    p.bool_grandParentSegment = data.grandParentSegment ? data.grandParentSegment : false
    p.uuid_tenantId = data.tenantId
    p.obj_address = data.address
    p.string_address = data.address ? JSON.stringify(data.address) : null
    p.string_attributes = data.attributes ? JSON.stringify(data.attributes) : '{}'
    p.date_createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : null
    p.string_description = data.description
    p.string_displayName = data.displayName
    p.keyword_displayName = data.displayName
    p.string_arr_emails = data.emails
    p.obj_employeeCountByCountry = data.employeeCountByCountry
    p.int_employees = data.employees
    p.int_founded = data.founded
    p.string_geoLocation = data.geoLocation
    p.string_location = data.location
    p.string_headline = data.headline
    p.keyword_importHash = data.importHash
    p.string_industry = data.industry
    p.string_arr_phoneNumbers = data.phoneNumbers
    p.string_arr_profiles = data.profiles
    p.obj_revenueRange = data.revenueRange
    p.string_size = data.size
    p.string_type = data.type
    p.string_url = data.url
    p.string_website = data.website
    p.date_lastEnrichedAt = data.lastEnrichedAt ? new Date(data.lastEnrichedAt).toISOString() : null
    p.bool_isTeamOrganization = data.isTeamOrganization ? data.isTeamOrganization : false
    p.bool_manuallyCreated = data.manuallyCreated ? data.manuallyCreated : false
    p.string_logo = data.logo || null
    p.obj_linkedin = data.linkedin
    p.obj_github = data.github
    p.obj_crunchbase = data.crunchbase
    p.obj_twitter = data.twitter
    p.string_immediateParent = data.immediateParent
    p.string_ultimateParent = data.ultimateParent
    p.string_arr_affiliatedProfiles = data.affiliatedProfiles
    p.string_arr_allSubsidiaries = data.allSubsidiaries
    p.string_arr_alternativeDomains = data.alternativeDomains
    p.string_arr_alternativeNames = data.alternativeNames
    p.float_averageEmployeeTenure = data.averageEmployeeTenure
    p.obj_averageTenureByLevel = data.averageTenureByLevel
    p.obj_averageTenureByRole = data.averageTenureByRole
    p.string_arr_directSubsidiaries = data.directSubsidiaries
    p.obj_employeeChurnRate = data.employeeChurnRate
    p.obj_employeeCountByMonth = data.employeeCountByMonth
    p.obj_employeeGrowthRate = data.employeeGrowthRate
    p.obj_employeeCountByMonthByLevel = data.employeeCountByMonthByLevel
    p.obj_employeeCountByMonthByRole = data.employeeCountByMonthByRole
    p.string_gicsSector = data.gicsSector
    p.obj_grossAdditionsByMonth = data.grossAdditionsByMonth
    p.obj_grossDeparturesByMonth = data.grossDeparturesByMonth
    p.obj_naics = data.naics
    p.string_ticker = data.ticker
    p.string_arr_tags = data.tags
    p.string_arr_manuallyChangedFields = data.manuallyChangedFields

    // identities
    const p_identities = []
    for (const identity of data.identities) {
      p_identities.push({
        string_platform: identity.platform,
        string_name: identity.name,
        keyword_name: identity.name,
        string_url: identity.url,
      })
    }
    p.nested_identities = p_identities

    // weak identities
    const p_weakIdentities = []
    for (const identity of data.weakIdentities) {
      p_weakIdentities.push({
        string_platform: identity.platform,
        string_name: identity.name,
        keyword_name: identity.name,
        string_url: identity.url,
      })
    }
    p.nested_weakIdentities = p_weakIdentities

    // aggregate data
    p.date_joinedAt = aggregates.joinedAt ? new Date(aggregates.joinedAt).toISOString() : null
    p.date_lastActive = aggregates.lastActive ? new Date(aggregates.lastActive).toISOString() : null
    p.string_arr_activeOn = aggregates.activeOn
    p.int_activityCount = aggregates.activityCount
    p.int_memberCount = aggregates.memberCount

    return p
  }
}
