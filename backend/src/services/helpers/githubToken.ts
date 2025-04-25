import axios from 'axios'
import * as jwt from 'jsonwebtoken'

import { GITHUB_TOKEN_CONFIG } from '@/conf'

let token: string | undefined
let expiration: Date | undefined

export const getGithubInstallationToken = async (): Promise<string> => {
  if (token && expiration && expiration.getTime() > Date.now()) {
    return token
  }

  // refresh token
  const config = GITHUB_TOKEN_CONFIG

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now - 60,
    exp: now + 10 * 60,
    iss: config.clientId,
  }

  const privateKey = Buffer.from(config.privateKey, 'base64').toString('ascii')

  const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

  const response = await axios.post(
    `https://api.github.com/app/installations/${config.installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  )

  token = response.data.token
  expiration = new Date(response.data.expires_at)

  return token
}
