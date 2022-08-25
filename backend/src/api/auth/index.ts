import { createRateLimiter } from '../apiRateLimiter'

export default (app) => {
  app.put(`/auth/password-reset`, require('./authPasswordReset').default)

  const emailRateLimiter = createRateLimiter({
    max: 6,
    windowMs: 15 * 60 * 1000,
    message: 'errors.429',
  })

  app.post(
    `/auth/send-email-address-verification-email`,
    emailRateLimiter,
    require('./authSendEmailAddressVerificationEmail').default,
  )

  app.post(
    `/auth/send-password-reset-email`,
    emailRateLimiter,
    require('./authSendPasswordResetEmail').default,
  )

  const signInRateLimiter = createRateLimiter({
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: 'errors.429',
  })

  app.post(`/auth/sign-in`, signInRateLimiter, require('./authSignIn').default)

  const signUpRateLimiter = createRateLimiter({
    max: 20,
    windowMs: 60 * 60 * 1000,
    message: 'errors.429',
  })

  app.post(`/auth/sign-up`, signUpRateLimiter, require('./authSignUp').default)

  app.put(`/auth/profile`, require('./authUpdateProfile').default)

  app.put(`/auth/change-password`, require('./authPasswordChange').default)

  app.put(`/auth/verify-email`, require('./authVerifyEmail').default)

  app.get(`/auth/me`, require('./authMe').default)
}
