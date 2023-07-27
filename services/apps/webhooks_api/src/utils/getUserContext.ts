import { IRepositoryOptions } from '../repo/IRepositoryOptions'
import SegmentRepository from '../repo/segmentRepository'
import SequelizeRepository from '../repo/sequelizeRepository'
import TenantRepository from '../repo/tenantRepository'
import UserRepository from '../repo/userRepository'

/**
 * Gets the IRepositoryOptions for given tenantId
 * Tries to inject user context of the given tenant as well (if tenant is associated with a user)
 * Useful when working outside express contexts(serverless)
 * @param tenantId
 * @returns IRepositoryOptions injected with currentTenant and currentUser
 */
export default async function getUserContext(
  tenantId: string,
  userId?: string,
  segmentIds?: string[],
): Promise<IRepositoryOptions> {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const tenant = await TenantRepository.findById(tenantId, {
    ...options,
  })
  options.currentTenant = tenant

  let user = null

  if (userId) {
    user = await UserRepository.findById(userId, {
      ...options,
      currentTenant: tenant,
      bypassPermissionValidation: true,
    })
  } else {
    const tenantUsers = await tenant.getUsers()

    if (tenantUsers.length > 0) {
      user = await UserRepository.findById(tenantUsers[0].userId, {
        ...options,
        currentTenant: tenant,
        bypassPermissionValidation: true,
      })
    }
  }

  const segments =
    segmentIds && segmentIds.length
      ? await new SegmentRepository(options).findInIds(segmentIds)
      : []

  // Inject user and tenant to IRepositoryOptions
  return SequelizeRepository.getDefaultIRepositoryOptions(user, tenant, segments)
}
