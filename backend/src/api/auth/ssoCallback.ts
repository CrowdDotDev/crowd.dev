import jwt from 'jsonwebtoken'
import AuthService from '../../services/auth/authService'
import { AUTH0_CONFIG } from '../../conf'
import Error401 from '@/errors/Error401'

export default async (req, res) => {
  const { idToken, invitationToken, tenantId } = req.body

  try {
    const verifyToken = new Promise((resolve, reject) => {
      const publicKey = AUTH0_CONFIG.cert.replace(/\\n/g, '\n')
      jwt.verify(idToken, publicKey, { algorithms: ['RS256'] }, (err, decoded) => {
        // If error verifying token
        if (err) {
          reject(new Error401())
        }

        // If token matches auth0 validation criteria
        const { aud, iss } = decoded
        if (aud !== AUTH0_CONFIG.clientId || !iss.includes(AUTH0_CONFIG.domain)) {
          reject(new Error401())
        }

        // If token validation passed
        resolve(decoded)
      })
    })
    const data: any = await verifyToken
    // Signin with data
    const token: string = await AuthService.signinFromSSO(
      'auth0',
      data.sub,
      data.email,
      data.email_verified,
      data.given_name,
      data.family_name,
      data.name,
      invitationToken,
      tenantId,
      req,
    )
    return res.send(token)
  } catch (err) {
    return res.status(401).send({ error: err })
  }
}
