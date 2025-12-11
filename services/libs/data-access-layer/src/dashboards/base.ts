import { QueryExecutor } from '../queryExecutor'

import { IDashboardMetrics } from './types'

export async function getMetrics(
  qx: QueryExecutor,
  segmentId?: string,
): Promise<IDashboardMetrics> {
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
      SELECT *
      FROM "${tableName}"
      LIMIT 1
    `

  const params = segmentId ? { segmentId } : {}

  try {
    const row = await qx.select(query, params)

    if (!row) {
      // TODO: remove this mock once Tinybird sinks are available
      return getMockMetrics()
    }

    return row
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    const code = error && typeof error === 'object' && 'code' in error ? error.code : null

    // Detect missing table
    const isMissingTable = code === '42P01' || /does not exist/i.test(msg)

    if (isMissingTable) {
      // TODO: remove this mock once Tinybird sinks are available
      return getMockMetrics()
    }

    throw error
  }
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
