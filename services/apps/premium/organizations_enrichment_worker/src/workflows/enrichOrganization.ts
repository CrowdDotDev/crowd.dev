import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/enrichment'
import { IEnrichableOrganizationData } from '@crowd/data-access-layer/src/old/apps/premium/organization_enrichment_worker/types'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function enrichOrganization(org: IEnrichableOrganizationData): Promise<void> {
  // TODO uros
  console.log('enriching org', org.organizationId)

  const updated = await aCtx.tryEnrichOrganization(org.organizationId)

  if (updated) {
    // TODO uros
    console.log('indexing org', org.organizationId)
    await aCtx.syncToOpensearch(org.tenantId, org.organizationId)
  }
}
