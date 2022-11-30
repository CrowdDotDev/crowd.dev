import passport from 'passport'
import { API_CONFIG, GOOGLE_CONFIG } from '../../config'
import AuthService from '../../services/auth/authService'
import { createServiceChildLogger } from '../../utils/logging'

const log = createServiceChildLogger('AuthSocial')

export default (app, routes) => {
  app.use(passport.initialize())

  passport.serializeUser((user, done) => {
    done(null, user)
  })

  passport.deserializeUser((user, done) => {
    done(null, user)
  })

  routes.post('/auth/social/onboard', async (req, res) => {
    const payload = await AuthService.handleOnboard(
      req.currentUser,
      req.body.invitationToken,
      req.body.tenantId,
      req,
    )

    await req.responseHandler.success(req, res, payload)
  })

  if (GOOGLE_CONFIG.clientId) {
    routes.get(
      '/auth/social/google',
      passport.authenticate('google', {
        scope: ['email', 'profile'],
        session: false,
      }),
      () => {
        // The request will be redirected for authentication, so this
        // function will not be called.
      },
    )

    routes.get('/auth/social/google/callback', (req, res) => {
      passport.authenticate('google', (err, jwtToken) => {
        handleCallback(res, err, jwtToken)
      })(req, res)
    })
  }
}

function handleCallback(res, err, jwtToken) {
  if (err) {
    log.error(err, 'Error handling social callback!')
    let errorCode = 'generic'

    if (['auth-invalid-provider', 'auth-no-email'].includes(err.message)) {
      errorCode = err.message
    }

    res.redirect(`${API_CONFIG.frontendUrl}/auth/signin?socialErrorCode=${errorCode}`)
    return
  }

  res.redirect(`${API_CONFIG.frontendUrl}/?social=true&authToken=${jwtToken}`)
}
