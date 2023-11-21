import { Error401 } from '@crowd/common'
import AuthService from '../services/auth/authService'

/**
 * Authenticates and fills the request with the user if it exists.
 * If no token is passed, it continues the request but without filling the currentUser.
 * If userAutoAuthenticatedEmailForTests exists and no token is passed, it fills with this user for tests.
 */
export async function authMiddleware(req, res, next) {
  const isTokenEmpty =
    (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    !(req.cookies && req.cookies.__session) &&
    !req.query.crowdToken

  if (isTokenEmpty) {
    next()
    return
  }

  let idToken

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1]
  } else if (req.cookies) {
    // Read the ID Token from cookie.
    idToken = req.cookies.__session
  } else if (req.query.crowdToken) {
    idToken = req.query.crowdToken
  } else {
    next()
    return
  }

  try {
    const currentUser: any = await AuthService.findByToken(idToken, req)

    req.currentUser = currentUser

    next()
  } catch (error) {
    await req.responseHandler.error(req, res, new Error401())
  }
}
