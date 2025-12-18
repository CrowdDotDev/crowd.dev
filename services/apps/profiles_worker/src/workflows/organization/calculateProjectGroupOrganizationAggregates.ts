import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'

const { calculateProjectGroupOrganizationAggregates: calculateAggregates } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '4 hours',
})

export interface ICalculateProjectGroupOrganizationAggregatesArgs {
  projectGroupId: string
  projectGroupName: string
  subprojectIds: string[]
}

/*
  Child workflow to calculate organization aggregates for a single project group segment.
  Aggregates data from all child subprojects (across all projects) into the project group segment.
*/
export async function calculateProjectGroupOrganizationAggregates(
  args: ICalculateProjectGroupOrganizationAggregatesArgs,
): Promise<number> {
  console.log(`Calculating organization aggregates for project group "${args.projectGroupName}"`)

  const count = await calculateAggregates(args.projectGroupId, args.subprojectIds)

  console.log(
    `Calculated ${count} organization aggregates for project group "${args.projectGroupName}"`,
  )

  return count
}
