import { TenantPlans } from '@crowd/types'
import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/tenantUpdate'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export interface IUpdateTenantOrganizationInput {
  tenantId: string
  plan: TenantPlans
  organizationId: string
  organizationCacheId: string
}

export async function updateTenantOrganization(input: IUpdateTenantOrganizationInput) {
  const updated = await aCtx.updateTenantOrganization(
    input.tenantId,
    input.organizationId,
    input.organizationCacheId,
  )

  if (updated) {
    await aCtx.syncToOpensearch(input.tenantId, input.organizationId)
    await aCtx.incrementTenantCredits(input.tenantId, input.plan)
  }
}
