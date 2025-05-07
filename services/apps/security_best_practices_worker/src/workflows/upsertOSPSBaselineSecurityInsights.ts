import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IUpsertOSPSBaselineSecurityInsightsParams } from '../types'

const { getOSPSBaselineInsights, saveOSPSBaselineInsightsToDB } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 1 },
})

export async function upsertOSPSBaselineSecurityInsights(
  args: IUpsertOSPSBaselineSecurityInsightsParams,
): Promise<void> {
  const key = await getOSPSBaselineInsights(args.repoUrl)
  await saveOSPSBaselineInsightsToDB(key, args)
}
