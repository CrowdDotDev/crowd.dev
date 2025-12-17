/**
 * TEST ONLY - Workflow to calculate leaf segment aggregates from activityRelations.
 *
 * This workflow is for local testing when Tinybird data is not available.
 * It can be triggered manually via Temporal UI:
 *   1. Go to Temporal UI
 *   2. Click "Start Workflow"
 *   3. Workflow Type: "calculateLeafSegmentAggregates"
 *   4. Task Queue: "profiles"
 *   5. Input: {} (empty object)
 *
 * The workflow will:
 *   1. Calculate member leaf segment aggregates from activityRelations
 *   2. Calculate organization leaf segment aggregates from activityRelations
 *   3. Log the counts of inserted aggregates
 *
 * After this completes, you can trigger the regular refresh workflows:
 *   - refreshMemberDisplayAggregates
 *   - refreshOrganizationDisplayAggregates
 * to roll up the leaf aggregates to project and project-group levels.
 */
import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'

const { calculateAllMemberLeafAggregates, calculateAllOrganizationLeafAggregates } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 minutes',
  })

export interface ICalculateLeafSegmentAggregatesResult {
  memberAggregatesCount: number
  organizationAggregatesCount: number
}

export async function calculateLeafSegmentAggregates(): Promise<ICalculateLeafSegmentAggregatesResult> {
  console.log('Starting leaf segment aggregates calculation (TEST ONLY)')
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
  console.log('')
  console.log('Next steps:')
  console.log('  1. Trigger "refreshMemberDisplayAggregates" to roll up member aggregates')
  console.log('  2. Trigger "refreshOrganizationDisplayAggregates" to roll up org aggregates')

  return {
    memberAggregatesCount: memberCount,
    organizationAggregatesCount: orgCount,
  }
}
