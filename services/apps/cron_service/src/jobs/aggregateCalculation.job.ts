import CronTime from 'cron-time-generator'

import {
  READ_DB_CONFIG,
  WRITE_DB_CONFIG,
  getDbConnection,
} from '@crowd/data-access-layer/src/database'
import {
  calculateMemberAggregatesForSegment,
  insertMemberSegmentAggregates,
} from '@crowd/data-access-layer/src/members/segments'
import {
  calculateOrganizationAggregatesForSegment,
  insertOrganizationSegments,
} from '@crowd/data-access-layer/src/organizations/segments'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { IJobContext, IJobDefinition } from '../types'

interface ISegment {
  id: string
  name: string
  parentId: string | null
  grandparentId: string | null
}

// Module-level state (safe because each job runs in its own process)
let segmentNames: Map<string, string>
let projectToProjectGroup: Map<string, string>
let subprojectsByParent: Map<string, string[]>
let subprojectsByGrandparent: Map<string, string[]>

const job: IJobDefinition = {
  name: 'aggregate-calculation',
  cronTime: CronTime.everyDayAt(3, 0), // 3 AM daily
  timeout: 4 * 60 * 60, // 4 hours
  process: async (ctx) => {
    ctx.log.info('Starting parent and grandparent aggregate calculation job')

    const readDb = await getDbConnection(READ_DB_CONFIG(), 3, 0)
    const writeDb = await getDbConnection(WRITE_DB_CONFIG())
    const readQx = pgpQx(readDb)
    const writeQx = pgpQx(writeDb)

    // Build segment hierarchy mapping
    ctx.log.info('Fetching segment hierarchy...')
    const segments: ISegment[] = await readQx.select(
      `
      SELECT id, name, "parentId", "grandparentId"
      FROM segments
      `,
    )

    // Initialize module-level maps
    segmentNames = new Map<string, string>()
    projectToProjectGroup = new Map<string, string>()
    subprojectsByParent = new Map<string, string[]>()
    subprojectsByGrandparent = new Map<string, string[]>()

    // Build segment name lookup and project -> project group mapping
    for (const s of segments) {
      segmentNames.set(s.id, s.name)
      // Projects have parentId (pointing to project group) but no grandparentId
      if (s.parentId !== null && s.grandparentId === null) {
        projectToProjectGroup.set(s.id, s.parentId)
      }
    }

    // Separate segments by type
    // Projects: have parentId (pointing to project group), no grandparentId
    const projectSegments = segments.filter((s) => s.parentId !== null && s.grandparentId === null)
    const subprojectSegments = segments.filter(
      (s) => s.parentId !== null && s.grandparentId !== null,
    )

    ctx.log.info(
      `Found ${projectSegments.length} project segments and ${subprojectSegments.length} subproject segments`,
    )

    // Build mappings: which subprojects belong to which parent/grandparent
    for (const sp of subprojectSegments) {
      // Map to parent (project)
      if (sp.parentId) {
        if (!subprojectsByParent.has(sp.parentId)) {
          subprojectsByParent.set(sp.parentId, [])
        }
        subprojectsByParent.get(sp.parentId)?.push(sp.id)
      }

      // Map to grandparent (project group)
      if (sp.grandparentId) {
        if (!subprojectsByGrandparent.has(sp.grandparentId)) {
          subprojectsByGrandparent.set(sp.grandparentId, [])
        }
        subprojectsByGrandparent.get(sp.grandparentId)?.push(sp.id)
      }
    }

    // Calculate member aggregates
    await calculateMemberAggregates(ctx, readQx, writeQx)

    // Calculate organization aggregates
    await calculateOrganizationAggregates(ctx, readQx, writeQx)

    ctx.log.info('Aggregate calculation job completed')
  },
}

async function calculateMemberAggregates(
  ctx: IJobContext,
  readQx: QueryExecutor,
  writeQx: QueryExecutor,
): Promise<void> {
  ctx.log.info('Calculating member aggregates...')

  let totalProjectAggs = 0
  let totalProjectGroupAggs = 0

  const totalProjects = subprojectsByParent.size
  let projectIndex = 0

  // Process parent (project) level aggregates
  for (const [parentSegmentId, subprojectIds] of subprojectsByParent) {
    projectIndex++
    const projectName = segmentNames.get(parentSegmentId) || parentSegmentId
    const projectGroupId = projectToProjectGroup.get(parentSegmentId)
    const projectGroupName = projectGroupId ? segmentNames.get(projectGroupId) : null
    ctx.log.info(
      `Processing member aggregates for project "${projectName}" in "${projectGroupName}" (${projectIndex}/${totalProjects})`,
    )

    const aggregates = await calculateMemberAggregatesForSegment(
      readQx,
      parentSegmentId,
      subprojectIds,
    )

    if (aggregates.length > 0) {
      await insertMemberSegmentAggregates(writeQx, aggregates)
      totalProjectAggs += aggregates.length
    }
  }

  ctx.log.info(`Inserted/updated ${totalProjectAggs} member aggregates for project segments`)

  const totalProjectGroups = subprojectsByGrandparent.size
  let projectGroupIndex = 0

  // Process grandparent (project group) level aggregates
  for (const [grandparentSegmentId, subprojectIds] of subprojectsByGrandparent) {
    projectGroupIndex++
    const projectGroupName = segmentNames.get(grandparentSegmentId) || grandparentSegmentId
    ctx.log.info(
      `Processing member aggregates for project group "${projectGroupName}" (${projectGroupIndex}/${totalProjectGroups})`,
    )

    const aggregates = await calculateMemberAggregatesForSegment(
      readQx,
      grandparentSegmentId,
      subprojectIds,
    )

    if (aggregates.length > 0) {
      await insertMemberSegmentAggregates(writeQx, aggregates)
      totalProjectGroupAggs += aggregates.length
    }
  }

  ctx.log.info(
    `Inserted/updated ${totalProjectGroupAggs} member aggregates for project group segments`,
  )
}

async function calculateOrganizationAggregates(
  ctx: IJobContext,
  readQx: QueryExecutor,
  writeQx: QueryExecutor,
): Promise<void> {
  ctx.log.info('Calculating organization aggregates...')

  let totalProjectAggs = 0
  let totalProjectGroupAggs = 0

  const totalProjects = subprojectsByParent.size
  let projectIndex = 0

  // Process parent (project) level aggregates
  for (const [parentSegmentId, subprojectIds] of subprojectsByParent) {
    projectIndex++
    const projectName = segmentNames.get(parentSegmentId) || parentSegmentId
    const projectGroupId = projectToProjectGroup.get(parentSegmentId)
    const projectGroupName = projectGroupId ? segmentNames.get(projectGroupId) : null
    ctx.log.info(
      `Processing organization aggregates for project "${projectName}" in "${projectGroupName}" (${projectIndex}/${totalProjects})`,
    )

    const aggregates = await calculateOrganizationAggregatesForSegment(
      readQx,
      parentSegmentId,
      subprojectIds,
    )

    if (aggregates.length > 0) {
      await insertOrganizationSegments(writeQx, aggregates)
      totalProjectAggs += aggregates.length
    }
  }

  ctx.log.info(`Inserted/updated ${totalProjectAggs} organization aggregates for project segments`)

  const totalProjectGroups = subprojectsByGrandparent.size
  let projectGroupIndex = 0

  // Process grandparent (project group) level aggregates
  for (const [grandparentSegmentId, subprojectIds] of subprojectsByGrandparent) {
    projectGroupIndex++
    const projectGroupName = segmentNames.get(grandparentSegmentId) || grandparentSegmentId
    ctx.log.info(
      `Processing organization aggregates for project group "${projectGroupName}" (${projectGroupIndex}/${totalProjectGroups})`,
    )

    const aggregates = await calculateOrganizationAggregatesForSegment(
      readQx,
      grandparentSegmentId,
      subprojectIds,
    )

    if (aggregates.length > 0) {
      await insertOrganizationSegments(writeQx, aggregates)
      totalProjectGroupAggs += aggregates.length
    }
  }

  ctx.log.info(
    `Inserted/updated ${totalProjectGroupAggs} organization aggregates for project group segments`,
  )
}

export default job
