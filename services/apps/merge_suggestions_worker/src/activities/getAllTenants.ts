import { ITenant } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker//types'
import { svc } from '../main'
import TenantRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/tenant.repo'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag } from '@crowd/types'

export async function getAllTenants(): Promise<ITenant[]> {
  const tenantRepository = new TenantRepository(svc.postgres.writer.connection(), svc.log)
  const tenants = await tenantRepository.getAllTenants()

  // map through the tenants array and resolve all promises
  const tenantPromises: Promise<boolean>[] = tenants.map(async (tenant) =>
    isFeatureEnabled(
      FeatureFlag.TEMPORAL_MEMBER_MERGE_SUGGESTIONS,
      async () => {
        return {
          tenantId: tenant.tenantId,
          plan: tenant.plan,
        }
      },
      svc.unleash,
    ),
  )

  // Wait for all promises to get resolved
  const tenantsEnabled = await Promise.all(tenantPromises)

  // Filter out tenants where the feature is not enabled
  return tenants.filter((_, index) => tenantsEnabled[index])
}
