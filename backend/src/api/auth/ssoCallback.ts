import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import AuthService from '../../services/auth/authService'
import { AUTH0_CONFIG } from '../../conf'
import Error401 from '../../errors/Error401'

const jwks = jwksClient({
  jwksUri: AUTH0_CONFIG.jwks,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 86400000,
})

async function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey
    callback(null, signingKey)
  })
}

export default async (req, res) => {
  const { idToken, invitationToken, tenantId } = req.body

  try {
    const verifyToken = new Promise((resolve, reject) => {
      jwt.verify(idToken, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          reject(new Error401())
        }

        const { aud } = decoded as any

        if (aud !== AUTH0_CONFIG.clientId) {
          reject(new Error401())
        }

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
