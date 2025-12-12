import { QueryExecutor } from '../queryExecutor'
import { getSubProjectsCount } from '../segments'

import { IDashboardMetrics } from './types'

export async function getMetrics(
  qx: QueryExecutor,
  segmentId?: string,
): Promise<IDashboardMetrics> {
  try {
    const [snapshotData, projectsData] = await Promise.all([
      getSnapshotMetrics(qx, segmentId),
      getSubProjectsCount(qx, segmentId),
    ])

    if (!snapshotData) {
      // TODO: remove this mock once Tinybird sinks are available
      const mockMetrics = getMockMetrics()
      return {
        ...mockMetrics,
        projectsTotal: projectsData.projectsTotal,
        projectsLast30Days: projectsData.projectsLast30Days,
      }
    }

    return {
      ...snapshotData,
      projectsTotal: projectsData.projectsTotal,
      projectsLast30Days: projectsData.projectsLast30Days,
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null

    // Detect missing table
    const isMissingTable = code === '42P01' || /does not exist/i.test(msg)

    if (isMissingTable) {
      // TODO: remove this mock once Tinybird sinks are available
      const mockMetrics = getMockMetrics()
      const projectsData = await getSubProjectsCount(qx, segmentId)
      return {
        ...mockMetrics,
        projectsTotal: projectsData.projectsTotal,
        projectsLast30Days: projectsData.projectsLast30Days,
      }
    }

    throw error
  }
}

async function getSnapshotMetrics(
  qx: QueryExecutor,
  segmentId?: string,
): Promise<Omit<IDashboardMetrics, 'projectsTotal' | 'projectsLast30Days'> | null> {
  const tableName = segmentId
    ? 'dashboardMetricsPerSegmentSnapshot'
    : 'dashboardMetricsTotalSnapshot'

  const query = segmentId
    ? `
      SELECT *
      FROM "${tableName}"
      WHERE "segmentId" = $(segmentId)
      LIMIT 1
    `
    : `
      SELECT 
        "activitiesLast30Days",
        "activitiesTotal",
        "membersLast30Days",
        "membersTotal",
        "organizationsLast30Days",
        "organizationsTotal",
        "updatedAt"
      FROM "${tableName}"
      LIMIT 1
    `

  const params = segmentId ? { segmentId } : {}
  const [row] = await qx.select(query, params)

  return row || null
}

function getMockMetrics(): IDashboardMetrics {
  return {
    activitiesTotal: 9926553,
    activitiesLast30Days: 64329,
    organizationsTotal: 104300,
    organizationsLast30Days: 36,
    membersTotal: 798730,
    membersLast30Days: 2694,
    projectsTotal: 123,
    projectsLast30Days: 12312,
  }
}
