import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/enrichment'
import { IEnrichableOrganizationData } from '@crowd/data-access-layer/src/organizations'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function enrichOrganization(org: IEnrichableOrganizationData): Promise<void> {
  const updated = await aCtx.tryEnrichOrganization(org.organizationId)

  if (updated) {
    await aCtx.syncToOpensearch(org.tenantId, org.organizationId)
  }
}
