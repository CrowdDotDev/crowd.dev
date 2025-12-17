import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'

const { calculateProjectGroupMemberAggregates: calculateAggregates } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '10 minutes',
})

export interface ICalculateProjectGroupMemberAggregatesArgs {
  projectGroupId: string
  projectGroupName: string
  subprojectIds: string[]
}

/*
  Child workflow to calculate member aggregates for a single project group segment.
  Aggregates data from all child subprojects (across all projects) into the project group segment.
*/
export async function calculateProjectGroupMemberAggregates(
  args: ICalculateProjectGroupMemberAggregatesArgs,
): Promise<number> {
  console.log(`Calculating member aggregates for project group "${args.projectGroupName}"`)

  const count = await calculateAggregates(args.projectGroupId, args.subprojectIds)

  console.log(`Calculated ${count} member aggregates for project group "${args.projectGroupName}"`)

  return count
}
