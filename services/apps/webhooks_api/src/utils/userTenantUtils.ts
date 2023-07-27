export function isUserInTenant(user, tenant) {
  if (!user) {
    return false
  }

  if (!tenant || !tenant.id) {
    return true
  }

  return user.tenants.some((tenantUser) => tenantUser.tenant.id === tenant.id)
}
