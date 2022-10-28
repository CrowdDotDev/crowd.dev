export default () => {
  return {
    currentUser: null,
    currentTenant: null,
    loadingInit: true,
    loadingEmailConfirmation: false,
    loadingPasswordResetEmail: false,
    loadingVerifyEmail: false,
    loadingPasswordReset: false,
    loadingPasswordChange: false,
    loadingUpdateProfile: false,
    loading: false
  }
}
