import { IDbOrganizationSyncData, IOrganizationSegmentMatrix } from '../repo/organization.data'
import { OrganizationRepository } from '../repo/organization.repo'
import { IDbSegmentInfo } from '../repo/segment.data'
import { SegmentRepository } from '../repo/segment.repo'
import { distinct } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger, logExecutionTime } from '@crowd/logging'
import { Edition, OpenSearchIndex } from '@crowd/types'
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IOrganizationSyncResult } from './organization.sync.data'
import { IServiceConfig } from '@crowd/types'

export class OrganizationSyncService {
  private log: Logger
  private readonly orgRepo: OrganizationRepository
  private readonly segmentRepo: SegmentRepository
  private readonly serviceConfig: IServiceConfig

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
    serviceConfig: IServiceConfig,
  ) {
    this.log = getChildLogger('organization-sync-service', parentLog)
    this.serviceConfig = serviceConfig

    this.orgRepo = new OrganizationRepository(store, this.log)
    this.segmentRepo = new SegmentRepository(store, this.log)
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

  public async syncTenantOrganizations(
    tenantId: string,
    batchSize = 100,
    syncCutoffTime?: string,
  ): Promise<void> {
    const cutoffDate = syncCutoffTime ? syncCutoffTime : new Date().toISOString()

    this.log.warn({ tenantId, cutoffDate }, 'Syncing all tenant organizations!')
    let docCount = 0
    let organizationCount = 0

    await logExecutionTime(
      async () => {
        let organizationIds = await this.orgRepo.getTenantOrganizationsForSync(
          tenantId,
          1,
          batchSize,
          cutoffDate,
        )

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
          organizationIds = await this.orgRepo.getTenantOrganizationsForSync(
            tenantId,
            1,
            batchSize,
            cutoffDate,
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
  public async syncOrganizations(organizationIds: string[]): Promise<IOrganizationSyncResult> {
    const CONCURRENT_DATABASE_QUERIES = 25
    const BULK_INDEX_DOCUMENT_BATCH_SIZE = 2500

    // get all orgId-segmentId couples
    const orgSegmentCouples: IOrganizationSegmentMatrix =
      await this.orgRepo.getOrganizationSegmentCouples(organizationIds)
    let databaseStream = []
    let syncStream = []
    let documentsIndexed = 0
    const allOrgIds = Object.keys(orgSegmentCouples)
    const totalOrgIds = allOrgIds.length

    const processSegmentsStream = async (databaseStream): Promise<void> => {
      const results = await Promise.all(databaseStream.map((s) => s.promise))

      let index = 0

      while (results.length > 0) {
        const result = results.shift()
        const { orgId, segmentId } = databaseStream[index]
        const orgSegments = orgSegmentCouples[orgId]

        // Find the correct segment and mark it as processed and add the data
        const targetSegment = orgSegments.find((s) => s.segmentId === segmentId)
        targetSegment.processed = true
        targetSegment.data = result

        // Check if all segments for the organization have been processed
        const allSegmentsOfOrgIsProcessed = orgSegments.every((s) => s.processed)
        if (allSegmentsOfOrgIsProcessed) {
          // All segments processed, push the segment related docs into syncStream
          syncStream.push(
            ...orgSegmentCouples[orgId].map((s) => {
              return {
                id: `${s.data.organizationId}-${s.data.segmentId}`,
                body: OrganizationSyncService.prefixData(s.data),
              }
            }),
          )

          const isMultiSegment = this.serviceConfig.edition === Edition.LFX

          if (isMultiSegment) {
            // also calculate and push for parent and grandparent segments
            const childSegmentIds: string[] = distinct(orgSegments.map((m) => m.segmentId))
            const segmentInfos = await this.segmentRepo.getParentSegmentIds(childSegmentIds)

            const parentIds: string[] = distinct(segmentInfos.map((s) => s.parentId))
            for (const parentId of parentIds) {
              const aggregated = OrganizationSyncService.aggregateData(
                orgSegmentCouples[orgId].map((s) => s.data),
                segmentInfos,
                parentId,
              )
              const prepared = OrganizationSyncService.prefixData(aggregated)
              syncStream.push({
                id: `${orgId}-${parentId}`,
                body: prepared,
              })
            }

            const grandParentIds = distinct(segmentInfos.map((s) => s.grandParentId))
            for (const grandParentId of grandParentIds) {
              const aggregated = OrganizationSyncService.aggregateData(
                orgSegmentCouples[orgId].map((s) => s.data),
                segmentInfos,
                undefined,
                grandParentId,
              )
              const prepared = OrganizationSyncService.prefixData(aggregated)
              syncStream.push({
                id: `${orgId}-${grandParentId}`,
                body: prepared,
              })
            }
          }

          // delete the orgId from matrix, we already created syncStreams for indexing to opensearch
          delete orgSegmentCouples[orgId]
        }

        index += 1
      }
    }

    for (let i = 0; i < totalOrgIds; i++) {
      const orgId = allOrgIds[i]
      const totalSegments = orgSegmentCouples[orgId].length

      for (let j = 0; j < totalSegments; j++) {
        const segment = orgSegmentCouples[orgId][j]
        databaseStream.push({
          orgId: orgId,
          segmentId: segment.segmentId,
          promise: this.orgRepo.getOrganizationDataInOneSegment(orgId, segment.segmentId),
        })

        // databaseStreams will create syncStreams items in processSegmentsStream, which'll later be used to sync to opensearch in bulk
        if (databaseStream.length >= CONCURRENT_DATABASE_QUERIES) {
          await processSegmentsStream(databaseStream)
          databaseStream = []
        }

        while (syncStream.length >= BULK_INDEX_DOCUMENT_BATCH_SIZE) {
          await this.openSearchService.bulkIndex(
            OpenSearchIndex.ORGANIZATIONS,
            syncStream.slice(0, BULK_INDEX_DOCUMENT_BATCH_SIZE),
          )
          documentsIndexed += syncStream.slice(0, BULK_INDEX_DOCUMENT_BATCH_SIZE).length
          syncStream = syncStream.slice(BULK_INDEX_DOCUMENT_BATCH_SIZE)
        }

        // if we're processing the last segment
        if (i === totalOrgIds - 1 && j === totalSegments - 1) {
          // check if there are remaining databaseStreams to process
          if (databaseStream.length > 0) {
            await processSegmentsStream(databaseStream)
          }

          // check if there are remaining syncStreams to process
          if (syncStream.length > 0) {
            await this.openSearchService.bulkIndex(OpenSearchIndex.ORGANIZATIONS, syncStream)
            documentsIndexed += syncStream.length
          }
        }
      }
    }

    await this.orgRepo.markSynced(organizationIds)

    return {
      organizationsSynced: organizationIds.length,
      documentsIndexed,
    }
  }

  private static aggregateData(
    segmentOrganizationss: IDbOrganizationSyncData[],
    segmentInfos: IDbSegmentInfo[],
    parentId?: string,
    grandParentId?: string,
  ): IDbOrganizationSyncData | undefined {
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

    const organizations = segmentOrganizationss.filter((m) =>
      relevantSubchildIds.includes(m.segmentId),
    )

    if (organizations.length === 0) {
      throw new Error('No organizations found for given parent or grandParent segment id!')
    }

    // aggregate data
    const organization = { ...organizations[0] }

    // use corrent id as segmentId
    if (parentId) {
      organization.segmentId = parentId
    } else {
      organization.segmentId = grandParentId
    }

    // reset aggregates
    organization.joinedAt = undefined
    organization.lastActive = undefined
    organization.activeOn = []
    organization.activityCount = 0
    organization.memberCount = 0
    organization.identities = []
    organization.memberIds = []

    for (const org of organizations) {
      if (!organization.joinedAt) {
        organization.joinedAt = org.joinedAt
      } else if (org.joinedAt) {
        const d1 = new Date(organization.joinedAt)
        const d2 = new Date(org.joinedAt)

        if (d1 > d2) {
          organization.joinedAt = org.joinedAt
        }
      }

      if (!organization.lastActive) {
        organization.lastActive = org.lastActive
      } else if (org.lastActive) {
        const d1 = new Date(organization.lastActive)
        const d2 = new Date(org.lastActive)

        if (d1 < d2) {
          organization.lastActive = org.lastActive
        }
      }

      organization.activeOn.push(...org.activeOn)
      organization.activityCount += org.activityCount
      // organization.memberCount += org.memberCount
      organization.identities.push(...org.identities)
      organization.memberIds.push(...org.memberIds)
    }

    // gather only uniques
    organization.activeOn = distinct(organization.activeOn)
    organization.identities = organization.identities.reduce((acc, identity) => {
      if (!acc.find((i) => i.platform === identity.platform && i.name === identity.name)) {
        acc.push(identity)
      }
      return acc
    }, [])
    organization.memberCount = distinct(organization.memberIds).length

    return organization
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static prefixData(data: IDbOrganizationSyncData): any {
    const p: Record<string, unknown> = {}

    p.uuid_organizationId = data.organizationId
    p.uuid_segmentId = data.segmentId
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
    p.date_joinedAt = data.joinedAt ? new Date(data.joinedAt).toISOString() : null
    p.date_lastActive = data.lastActive ? new Date(data.lastActive).toISOString() : null
    p.string_arr_activeOn = data.activeOn
    p.int_activityCount = data.activityCount
    p.int_memberCount = data.memberCount

    return p
  }
}
