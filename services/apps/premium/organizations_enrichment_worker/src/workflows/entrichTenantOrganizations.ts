import { IPremiumTenantInfo } from '../repos/tenant.repo'
import * as activities from '../activities/organizationEnrichment'
import { proxyActivities } from '@temporalio/workflow'

const { getTenantCredits } = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function enrichTenantOrganizations(tenant: IPremiumTenantInfo): Promise<void> {
  // check how many credits the tenant has left
  // this will be our limit (1 credit = 1 enriched organization)
  const credits = await getTenantCredits(tenant)

  if (credits === -1) {
    // we have unlimited credits
  } else if (credits > 0) {
    // we have a finite amount of credits left
  }
}
