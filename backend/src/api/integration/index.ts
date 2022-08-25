import passport from 'passport'
import { getConfig } from '../../config'
import { authMiddleware } from '../../middlewares/authMiddleware'
import TenantService from '../../services/tenantService'
import { getTwitterStrategy } from '../../services/auth/passportStrategies/superfaceTwitterStrategy'
import { getSlackStrategy } from '../../services/auth/passportStrategies/slackStrategy'

export default (app) => {
  app.post(`/tenant/:tenantId/integration`, require('./integrationCreate').default)
  app.put(`/tenant/:tenantId/integration/:id`, require('./integrationUpdate').default)
  app.post(`/tenant/:tenantId/integration/import`, require('./integrationImport').default)
  app.delete(`/tenant/:tenantId/integration`, require('./integrationDestroy').default)
  app.get(
    `/tenant/:tenantId/integration/autocomplete`,
    require('./integrationAutocomplete').default,
  )
  app.get(`/tenant/:tenantId/integration`, require('./integrationList').default)
  app.get(`/tenant/:tenantId/integration/:id`, require('./integrationFind').default)

  app.put(`/authenticate/:tenantId/:code`, require('./helpers/githubAuthenticate').default)
  app.put(
    `/discord-authenticate/:tenantId/:guild_id`,
    require('./helpers/discordAuthenticate').default,
  )

  if (getConfig().AUTH_SOCIAL_TWITTER_CLIENT_ID) {
    passport.use(getTwitterStrategy())

    /**
     * Using the passport.authenticate this endpoint forces a
     * redirect to happen to the twitter oauth2 page.
     * We keep a state of the important variables such as tenantId, redirectUrl, ..
     * so that after user logs in through the twitter page, these
     * variables are forwarded back to the callback as well
     * This state is sent using the authenticator options and
     * manipulated through twitterStrategy.staticPKCEStore
     */
    app.get('/twitter/:tenantId/connect', require('./helpers/twitterAuthenticate').default, () => {
      // The request will be redirected for authentication, so this
      // function will not be called.
    })

    /**
     * OAuth2 callback endpoint.  After user successfully
     * logs in through twitter page s/he is redirected to
     * this endpoint. Few middlewares first mimic a proper
     * api request in this order:
     *
     * Set headers-> Auth middleware (currentUser)-> Set currentTenant
     * -> finally we call the project service to update the
     * corresponding project.
     *
     * We have to call these standart middlewares explicitly because
     * the request method is get and tenant id does not exist in the
     * uri as request parameters.
     *
     */
    app.get(
      '/twitter/callback',
      passport.authenticate('twitter', {
        session: false,
        failureRedirect: '/',
      }),
      (req, _res, next) => {
        const { crowdToken } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      require('./helpers/twitterAuthenticateCallback').default,
    )
  }

  /**
   * Slack integration endpoints
   * These should be super similar to Twitter's, since we're also using passport.js
   */
  if (getConfig().SLACK_CLIENT_ID) {
    passport.use(getSlackStrategy())

    // path to start the OAuth flow
    app.get('/slack/:tenantId/connect', require('./helpers/slackAuthenticate').default)

    // OAuth callback url
    app.get(
      '/slack/callback',
      passport.authorize('slack', {
        session: false,
        failureRedirect: '/',
      }),
      (req, _res, next) => {
        const { crowdToken } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      require('./helpers/slackAuthenticateCallback').default,
    )
  }
}
