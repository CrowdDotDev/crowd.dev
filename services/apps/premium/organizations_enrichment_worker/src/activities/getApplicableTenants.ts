import { IPremiumTenantInfo, TenantRepository } from '../repos/tenant.repo'
import { svc } from '../main'

export async function getApplicableTenants(
  page: number,
  lastId?: string,
): Promise<IPremiumTenantInfo[]> {
  const repo = new TenantRepository(svc.postgres.reader, svc.log)
  const tenants = await repo.getPremiumTenants(page, lastId)
  return tenants
}
