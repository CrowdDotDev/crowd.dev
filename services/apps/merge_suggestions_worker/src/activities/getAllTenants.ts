import { ITenantId } from 'types'
import { svc } from '../main'
import TenantRepository from 'repo/tenant.repo'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag } from '@crowd/types'

export async function getAllTenants(): Promise<ITenantId[]> {
  const tenantRepository = new TenantRepository(svc.postgres.writer.connection(), svc.log)
  const tenants = await tenantRepository.getAllTenants()

  return tenants.filter(
    async (tenant) =>
      await isFeatureEnabled(
        FeatureFlag.TEMPORAL_MEMBER_MERGE_SUGGESTIONS,
        async () => {
          return {
            tenantId: tenant.tenantId,
          }
        },
        svc.unleash,
      ),
  )
}
