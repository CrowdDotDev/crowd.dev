import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/enrichment'
import { IEnrichableOrganizationCache } from '@crowd/data-access-layer/src/old/apps/premium/organization_enrichment_worker/types'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function enrichOrganizationCache(data: IEnrichableOrganizationCache): Promise<void> {
  await aCtx.tryEnrichOrganizationCache(data.id)
}
