import { proxyActivities } from '@temporalio/workflow'

import { IEnrichableOrganizationData } from '@crowd/data-access-layer/src/organizations'

import * as activities from '../activities/enrichment'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function enrichOrganization(org: IEnrichableOrganizationData): Promise<void> {
  const updated = await aCtx.tryEnrichOrganization(org.organizationId)

  if (updated) {
    await aCtx.syncToOpensearch(org.tenantId, org.organizationId)
  }
}
