import SequelizeRepository from '../database/repositories/sequelizeRepository'

export default function getTenatUser(userId, options) {
  let userIdOut
  if (!userId) {
    // Get current user
    userIdOut = SequelizeRepository.getCurrentUser({
      ...options,
    }).id
  } else {
    userIdOut = userId
  }

  const tenantIdOut = SequelizeRepository.getCurrentTenant({ ...options }).id
  return {
    userIdOut,
    tenantIdOut,
  }
}
