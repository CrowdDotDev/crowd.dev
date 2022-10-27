import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'
import { get } from 'lodash'
import AuthService from '../../services/auth/authService'
import ApiResponseHandler from '../apiResponseHandler'
import { databaseInit } from '../../database/databaseConnection'
import { GOOGLE_CONFIG, API_CONFIG } from '../../config'

export default (app, routes) => {
  app.use(passport.initialize())

  passport.serializeUser((user, done) => {
    done(null, user)
  })

  passport.deserializeUser((user, done) => {
    done(null, user)
  })

  routes.post('/auth/social/onboard', async (req, res) => {
    try {
      const payload = await AuthService.handleOnboard(
        req.currentUser,
        req.body.invitationToken,
        req.body.tenantId,
        req,
      )

      await ApiResponseHandler.success(req, res, payload)
    } catch (error) {
      await ApiResponseHandler.error(req, res, error)
    }
  })

  if (GOOGLE_CONFIG.clientId) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CONFIG.clientId,
          clientSecret: GOOGLE_CONFIG.clientSecret,
          callbackURL: GOOGLE_CONFIG.callbackUrl,
        },
        (accessToken, refreshToken, profile, done) => {
          databaseInit()
            .then((database) => {
              const email = get(profile, 'emails[0].value')
              const emailVerified = get(profile, 'emails[0].verified', false)
              const displayName = get(profile, 'displayName')
              const { firstName, lastName } = splitFullName(displayName)

              return AuthService.signinFromSocial(
                'google',
                profile.id,
                email,
                emailVerified,
                firstName,
                lastName,
                displayName,
                { database },
              )
            })
            .then((jwtToken) => {
              done(null, jwtToken)
            })
            .catch((error) => {
              console.error(error)
              done(error, null)
            })
        },
      ),
    )

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
    console.error(err)
    let errorCode = 'generic'

    if (['auth-invalid-provider', 'auth-no-email'].includes(err.message)) {
      errorCode = err.message
    }

    res.redirect(`${API_CONFIG.frontendUrl}/auth/signin?socialErrorCode=${errorCode}`)
    return
  }

  res.redirect(`${API_CONFIG.frontendUrl}/?social=true&authToken=${jwtToken}`)
}

function splitFullName(fullName) {
  let firstName
  let lastName

  if (fullName && fullName.split(' ').length > 1) {
    const [firstNameArray, ...lastNameArray] = fullName.split(' ')
    firstName = firstNameArray
    lastName = lastNameArray.join(' ')
  } else {
    firstName = fullName || null
    lastName = null
  }

  return { firstName, lastName }
}
