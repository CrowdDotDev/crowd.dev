import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/organizationEnrichment'
import { TenantPlans } from '@crowd/types'

const { tryEnrichOrganization, incrementTenantCredits, syncToOpensearch } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '75 seconds',
})

export interface IEnrichOrganizationInput {
  organizationId: string
  tenantId: string
  plan: TenantPlans
}

export async function enrichOrganization(input: IEnrichOrganizationInput): Promise<void> {
  const wasEnriched = await tryEnrichOrganization(input.tenantId, input.organizationId)

  if (wasEnriched) {
    await syncToOpensearch(input.tenantId, input.organizationId)
    await incrementTenantCredits(input.tenantId, input.plan)
  }
}
