import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'

const { calculateProjectOrganizationAggregates: calculateAggregates } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '10 minutes',
})

export interface ICalculateProjectOrganizationAggregatesArgs {
  projectId: string
  projectName: string
  subprojectIds: string[]
}

/*
  Child workflow to calculate organization aggregates for a single project segment.
  Aggregates data from all child subprojects into the project segment.
*/
export async function calculateProjectOrganizationAggregates(
  args: ICalculateProjectOrganizationAggregatesArgs,
): Promise<number> {
  console.log(`Calculating organization aggregates for project "${args.projectName}"`)

  const count = await calculateAggregates(args.projectId, args.subprojectIds)

  console.log(`Calculated ${count} organization aggregates for project "${args.projectName}"`)

  return count
}
