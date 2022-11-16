import { IRepositoryOptions } from '../repositories/IRepositoryOptions'
import SequelizeRepository from '../repositories/sequelizeRepository'
import TenantRepository from '../repositories/tenantRepository'

/**
 * Gets the IRepositoryOptions for given tenantId
 * Tries to inject user context of the given tenant as well (if tenant is associated with a user)
 * Useful when working outside express contexts(serverless)
 * @param tenantId
 * @returns IRepositoryOptions injected with currentTenant and currentUser
 */
export default async function getUserContext(tenantId: string): Promise<IRepositoryOptions> {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const tenant = await TenantRepository.findById(tenantId, {
    ...options,
  })

  let user = null
  const tenantUsers = await tenant.getUsers()

  if (tenantUsers.length > 0) {
    user = await tenantUsers[0].getUser()
  }

  // Inject user and tenant to IRepositoryOptions
  return SequelizeRepository.getDefaultIRepositoryOptions(user, tenant)
}
