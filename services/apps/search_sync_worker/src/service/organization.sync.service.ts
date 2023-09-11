import { SERVICE_CONFIG } from '@/conf'
import { IDbOrganizationSyncData } from '@/repo/organization.data'
import { OrganizationRepository } from '@/repo/organization.repo'
import { IDbSegmentInfo } from '@/repo/segment.data'
import { SegmentRepository } from '@/repo/segment.repo'
import { distinct, groupBy } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, logExecutionTime } from '@crowd/logging'
import { Edition, OpenSearchIndex } from '@crowd/types'
import { IIndexRequest, IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IOrganizationSyncResult } from './organization.sync.data'

export class OrganizationSyncService extends LoggerBase {
  private readonly orgRepo: OrganizationRepository
  private readonly segmentRepo: SegmentRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    super(parentLog)

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

    const sort = [{ date_joinedAt: 'asc' }]
    const include = ['date_joinedAt', 'uuid_organizationId']
    const pageSize = 500
    let lastJoinedAt: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.ORGANIZATIONS,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ date_joinedAt: string; uuid_organizationId: string }>[]

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
      )) as ISearchHit<{ date_joinedAt: string; uuid_organizationId: string }>[]
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
    batchSize = 200,
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

  public async syncOrganizations(organizationIds: string[]): Promise<IOrganizationSyncResult> {
    this.log.debug({ organizationIds }, 'Syncing organizations!')

    const isMultiSegment = SERVICE_CONFIG().edition === Edition.LFX

    let docCount = 0
    let organizationCount = 0

    const organizations = await this.orgRepo.getOrganizationData(organizationIds)

    if (organizations.length > 0) {
      let childSegmentIds: string[] | undefined
      let segmentInfos: IDbSegmentInfo[] | undefined

      if (isMultiSegment) {
        childSegmentIds = distinct(organizations.map((m) => m.segmentId))
        segmentInfos = await this.segmentRepo.getParentSegmentIds(childSegmentIds)
      }

      const grouped = groupBy(organizations, (m) => m.organizationId)
      const organizationIds = Array.from(grouped.keys())

      const forSync: IIndexRequest<unknown>[] = []
      for (const organizationId of organizationIds) {
        const organizationDocs = grouped.get(organizationId)
        if (isMultiSegment) {
          for (const organization of organizationDocs) {
            // index each of them individually because it's per leaf segment
            const prepared = OrganizationSyncService.prefixData(organization)
            forSync.push({
              id: `${organizationId}-${organization.segmentId}`,
              body: prepared,
            })

            const relevantSegmentInfos = segmentInfos.filter((s) => s.id === organization.segmentId)

            // and for each parent and grandparent
            const parentIds = distinct(relevantSegmentInfos.map((s) => s.parentId))
            for (const parentId of parentIds) {
              const aggregated = OrganizationSyncService.aggregateData(
                organizationDocs,
                relevantSegmentInfos,
                parentId,
              )
              const prepared = OrganizationSyncService.prefixData(aggregated)
              forSync.push({
                id: `${organizationId}-${parentId}`,
                body: prepared,
              })
            }

            const grandParentIds = distinct(relevantSegmentInfos.map((s) => s.grandParentId))
            for (const grandParentId of grandParentIds) {
              const aggregated = OrganizationSyncService.aggregateData(
                organizationDocs,
                relevantSegmentInfos,
                undefined,
                grandParentId,
              )
              const prepared = OrganizationSyncService.prefixData(aggregated)
              forSync.push({
                id: `${organizationId}-${grandParentId}`,
                body: prepared,
              })
            }
          }
        } else {
          if (organizationDocs.length > 1) {
            throw new Error(
              'More than one organization found - this can not be the case in single segment edition!',
            )
          }

          const organization = organizationDocs[0]
          const prepared = OrganizationSyncService.prefixData(organization)
          forSync.push({
            id: `${organizationId}-${organization.segmentId}`,
            body: prepared,
          })
        }
      }

      await this.openSearchService.bulkIndex(OpenSearchIndex.ORGANIZATIONS, forSync)
      docCount += forSync.length
      organizationCount += organizationIds.length
    }

    await this.orgRepo.markSynced(organizationIds)

    return {
      organizationsSynced: organizationCount,
      documentsIndexed: docCount,
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
      organization.memberCount += org.memberCount
      organization.identities.push(...org.identities)
    }

    // gather only uniques
    organization.activeOn = distinct(organization.activeOn)
    organization.identities = distinct(organization.identities)

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
    p.string_arr_tags = data.tags
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
    if (data.revenueRange?.min) {
      p.int_revenueRangeMin = data.revenueRange.min
    }
    if (data.revenueRange?.max) {
      p.int_revenueRangeMax = data.revenueRange.max
    }
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
    p.float_employeeChurnRate12Month = data.employeeChurnRate12Month
    p.float_employeeGrowthRate12Month = data.employeeGrowthRate12Month
    p.obj_employeeChurnRate = data.employeeChurnRate
    p.obj_employeeCountByMonth = data.employeeCountByMonth
    p.obj_employeeGrowthRate = data.employeeGrowthRate
    p.obj_employeeCountByMonthByLevel = data.employeeCountByMonthByLevel
    p.obj_employeeCountByMonthByRole = data.employeeCountByMonthByRole
    p.string_gicsSector = data.gicsSector
    p.obj_grossAdditionsByMonth = data.grossAdditionsByMonth
    p.obj_grossDeparturesByMonth = data.grossDeparturesByMonth

    // aggregate data
    p.date_joinedAt = data.joinedAt ? new Date(data.joinedAt).toISOString() : null
    p.date_lastActive = data.lastActive ? new Date(data.lastActive).toISOString() : null
    p.string_arr_activeOn = data.activeOn
    p.int_activityCount = data.activityCount
    p.int_memberCount = data.memberCount
    p.string_arr_identities = data.identities

    return p
  }
}
