import { RedisCache } from '@crowd/redis'
import axios from 'axios'
import PermissionChecker from '../../../services/user/permissionChecker'
import Permissions from '../../../security/permissions'
import IntegrationService from '../../../services/integrationService'
import { API_CONFIG, TWITTER_CONFIG } from '../../../conf'

const errorURL = `${API_CONFIG.frontendUrl}/integrations?error=true`

export default async (req, res) => {
  // Checking we have permision to edit the integration
  new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

  const cache = new RedisCache('twitterPKCE', req.redis, req.log)

  const userId = req.currentUser.id
  const externalState = JSON.parse(req.query.state)

  const { handle } = externalState

  let redirectUrl
  let codeVerifier
  let hashtags

  cache.get(userId).then((existingValue) => {
    if (!existingValue) {
      res.redirect(errorURL)
    }

    const stateObj = JSON.parse(existingValue)

    cache.delete(userId).then(() => {
      if (stateObj.handle !== handle) {
        res.redirect(errorURL)
      }

      redirectUrl = stateObj.redirectUrl
      codeVerifier = stateObj.codeVerifier
    })
  })

  const oauthVerifier = req.query.code

  try {
    const response = await axios.post(
      'https://api.twitter.com/oauth/access_token',
      {},
      {
        params: {
          client_id: TWITTER_CONFIG.clientId,
          code: oauthVerifier,
          grant_type: 'authorization_code',
          redirect_uri: redirectUrl,
          code_verifier: codeVerifier,
        },
      },
    )

    const integrationData = {
      profileId: response.data.user_id,
      token: response.data.access_token,
      refreshToken: response.data.refresh_token,
      hashtags,
    }
    await new IntegrationService(req).twitterCallback(integrationData)

    res.redirect(redirectUrl)
  } catch (error) {
    res.redirect(errorURL)
  }
}