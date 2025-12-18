/**
 * Workflow to calculate leaf segment (subproject) aggregates from activityRelations.
 *
 * This workflow calculates the base-level aggregates for members and organizations
 * by querying activityRelations grouped by (entityId, segmentId).
 *
 * Scheduled to run every 5 minutes to keep leaf aggregates up-to-date.
 *
 * The non-leaf aggregate workflows (refreshMemberDisplayAggregates, refreshOrganizationDisplayAggregates)
 * then roll up these leaf aggregates to project and project-group levels.
 */
import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'

const { calculateAllMemberLeafAggregates, calculateAllOrganizationLeafAggregates } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '4 hours',
  })

export interface ICalculateLeafSegmentAggregatesResult {
  memberAggregatesCount: number
  organizationAggregatesCount: number
}

export async function calculateLeafSegmentAggregates(): Promise<ICalculateLeafSegmentAggregatesResult> {
  console.log('Starting leaf segment aggregates calculation')
  console.log('This calculates leaf/subproject level aggregates from activityRelations')

  // Calculate member aggregates
  console.log('Step 1/2: Calculating member leaf segment aggregates...')
  const memberCount = await calculateAllMemberLeafAggregates()
  console.log(`Completed: ${memberCount} member aggregates`)

  // Calculate organization aggregates
  console.log('Step 2/2: Calculating organization leaf segment aggregates...')
  const orgCount = await calculateAllOrganizationLeafAggregates()
  console.log(`Completed: ${orgCount} organization aggregates`)

  console.log('Leaf segment aggregates calculation complete!')
  console.log(`Total: ${memberCount} member + ${orgCount} organization aggregates`)

  return {
    memberAggregatesCount: memberCount,
    organizationAggregatesCount: orgCount,
  }
}
