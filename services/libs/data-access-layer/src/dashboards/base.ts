import { QueryExecutor } from '../queryExecutor'
import { getSubProjectsCount } from '../segments'

import { IDashboardMetrics } from './types'

export async function getMetrics(
  qx: QueryExecutor,
  segmentId?: string,
): Promise<IDashboardMetrics> {
  const [snapshotData, projectsData] = await Promise.all([
    getSnapshotMetrics(qx, segmentId),
    getSubProjectsCount(qx, segmentId),
  ])

  return {
    activitiesLast30Days: snapshotData?.activitiesLast30Days || 0,
    activitiesTotal: snapshotData?.activitiesTotal || 0,
    membersLast30Days: snapshotData?.membersLast30Days || 0,
    membersTotal: snapshotData?.membersTotal || 0,
    organizationsLast30Days: snapshotData?.organizationsLast30Days || 0,
    organizationsTotal: snapshotData?.organizationsTotal || 0,
    projectsLast30Days: projectsData.projectsLast30Days,
    projectsTotal: projectsData.projectsTotal,
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
