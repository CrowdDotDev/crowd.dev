export default {
  loading: (state) => Boolean(state.loading),
  warningMessage: (state) => state.warningMessage,
  invitationToken(
    state,
    getters,
    rootState,
    rootGetters
  ) {
    return (tenant) => {
      const currentUser = rootGetters['auth/currentUser']

      if (!currentUser || !currentUser.tenants) {
        return false
      }

      const tenantUser = currentUser.tenants.find(
        (tenantUser) =>
          tenantUser.tenant.id === tenant.id &&
          tenantUser.status === 'invited'
      )

      if (!tenantUser) {
        return null
      }

      return tenantUser.invitationToken
    }
  }
}
