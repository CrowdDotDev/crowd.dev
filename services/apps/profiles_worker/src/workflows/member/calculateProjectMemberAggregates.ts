import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'

const { calculateProjectMemberAggregates: calculateAggregates } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '4 hours',
})

export interface ICalculateProjectMemberAggregatesArgs {
  projectId: string
  projectName: string
  subprojectIds: string[]
}

/*
  Child workflow to calculate member aggregates for a single project segment.
  Aggregates data from all child subprojects into the project segment.
*/
export async function calculateProjectMemberAggregates(
  args: ICalculateProjectMemberAggregatesArgs,
): Promise<number> {
  console.log(`Calculating member aggregates for project "${args.projectName}"`)

  const count = await calculateAggregates(args.projectId, args.subprojectIds)

  console.log(`Calculated ${count} member aggregates for project "${args.projectName}"`)

  return count
}
