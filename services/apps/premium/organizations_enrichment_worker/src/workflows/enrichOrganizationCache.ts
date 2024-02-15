import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/enrichment'
import { IEnrichableOrganizationCache } from '../types/common'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function enrichOrganizationCache(data: IEnrichableOrganizationCache): Promise<void> {
  await aCtx.tryEnrichOrganizationCache(data.id)
}
