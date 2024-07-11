import OrganizationRepo from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'
import { svc } from '../../main'
import { IOrganizationIdentity } from '@crowd/types'

export async function getOrgIdentitiesWithInvalidUrls(
  tenantId: string,
  limit: number,
): Promise<IOrganizationIdentity[]> {
  let organizations: IOrganizationIdentity[] = []

  try {
    const repo = new OrganizationRepo(svc.postgres.reader.connection(), svc.log)
    organizations = await repo.getOrgIdentitiesWithInvalidUrls(tenantId, limit)
  } catch (err) {
    throw new Error(err)
  }

  return organizations
}

export async function findOrganizationIdentity(
  platform: string,
  value: string,
  type: string,
  verified: boolean,
  tenantId: string,
): Promise<IOrganizationIdentity> {
  let orgIdentity: IOrganizationIdentity

  try {
    const repo = new OrganizationRepo(svc.postgres.reader.connection(), svc.log)
    orgIdentity = await repo.findOrganizationIdentity(platform, value, type, verified, tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return orgIdentity
}

export async function updateOrganizationIdentity(
  orgId: string,
  platform: string,
  newValue: string,
  oldValue: string,
  type: string,
  verified: boolean,
  tenantId: string,
): Promise<void> {
  try {
    const repo = new OrganizationRepo(svc.postgres.writer.connection(), svc.log)
    await repo.updateOrganizationIdentity(
      orgId,
      platform,
      newValue,
      oldValue,
      type,
      verified,
      tenantId,
    )
  } catch (err) {
    throw new Error(err)
  }
}

export async function deleteOrganizationIdentity(
  orgId: string,
  platform: string,
  type: string,
  value: string,
  verified: boolean,
  tenantId: string,
): Promise<void> {
  try {
    const repo = new OrganizationRepo(svc.postgres.writer.connection(), svc.log)
    await repo.deleteOrganizationIdentity(orgId, platform, type, value, verified, tenantId)
  } catch (err) {
    throw new Error(err)
  }
}
