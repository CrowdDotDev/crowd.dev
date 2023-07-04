import { AUTH0_CONFIG } from '../../conf/index'
import { createRateLimiter } from '../apiRateLimiter'
import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.put(`/auth/password-reset`, safeWrap(require('./authPasswordReset').default))

  const emailRateLimiter = createRateLimiter({
    max: 6,
    windowMs: 15 * 60 * 1000,
    message: 'errors.429',
  })

  app.post(
    `/auth/send-email-address-verification-email`,
    emailRateLimiter,
    safeWrap(require('./authSendEmailAddressVerificationEmail').default),
  )

  app.post(
    `/auth/send-password-reset-email`,
    emailRateLimiter,
    safeWrap(require('./authSendPasswordResetEmail').default),
  )

  const signInRateLimiter = createRateLimiter({
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: 'errors.429',
  })

  app.post(`/auth/sign-in`, signInRateLimiter, safeWrap(require('./authSignIn').default))

  const signUpRateLimiter = createRateLimiter({
    max: 20,
    windowMs: 60 * 60 * 1000,
    message: 'errors.429',
  })

  app.post(`/auth/sign-up`, signUpRateLimiter, safeWrap(require('./authSignUp').default))

  app.put(`/auth/profile`, safeWrap(require('./authUpdateProfile').default))

  app.put(`/auth/change-password`, safeWrap(require('./authPasswordChange').default))

  app.put(`/auth/verify-email`, safeWrap(require('./authVerifyEmail').default))

  app.get(`/auth/me`, safeWrap(require('./authMe').default))

  if (AUTH0_CONFIG.clientId) {
    app.post(`/auth/sso/callback`, safeWrap(require('./ssoCallback').default))
  }
}
