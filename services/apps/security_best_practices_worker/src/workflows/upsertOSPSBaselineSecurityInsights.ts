import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IUpsertOSPSBaselineSecurityInsightsParams } from '../types'

const { getOSPSBaselineInsights, saveOSPSBaselineInsightsToDB } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '2 minutes',
  retry: { maximumAttempts: 2, initialInterval: 2 * 1000, backoffCoefficient: 3 },
})

export async function upsertOSPSBaselineSecurityInsights(
  args: IUpsertOSPSBaselineSecurityInsightsParams,
): Promise<void> {
  const key = await getOSPSBaselineInsights(args.repoUrl, args.token)
  await saveOSPSBaselineInsightsToDB(key, args)
}
