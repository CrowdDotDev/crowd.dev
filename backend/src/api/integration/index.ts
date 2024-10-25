import passport from 'passport'

import { RedisCache } from '@crowd/redis'
import { FeatureFlag } from '@crowd/types'

import { featureFlagMiddleware } from '@/middlewares/featureFlagMiddleware'

import { API_CONFIG, SLACK_CONFIG, TWITTER_CONFIG } from '../../conf'
import SegmentRepository from '../../database/repositories/segmentRepository'
import { authMiddleware } from '../../middlewares/authMiddleware'
import { safeWrap } from '../../middlewares/errorMiddleware'
import TenantService from '../../services/tenantService'

const decodeBase64Url = (data) => {
  data = data.replaceAll('-', '+').replaceAll('_', '/')
  while (data.length % 4) {
    data += '='
  }
  return atob(data)
}

export default (app) => {
  app.post(`/tenant/:tenantId/integration/query`, safeWrap(require('./integrationQuery').default))
  app.post(`/tenant/:tenantId/integration`, safeWrap(require('./integrationCreate').default))
  app.put(`/tenant/:tenantId/integration/:id`, safeWrap(require('./integrationUpdate').default))
  app.post(`/tenant/:tenantId/integration/import`, safeWrap(require('./integrationImport').default))
  app.delete(`/tenant/:tenantId/integration`, safeWrap(require('./integrationDestroy').default))
  app.get(
    `/tenant/:tenantId/integration/autocomplete`,
    safeWrap(require('./integrationAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/integration`, safeWrap(require('./integrationList').default))
  app.get(`/tenant/:tenantId/integration/:id`, safeWrap(require('./integrationFind').default))

  app.put(
    `/authenticate/:tenantId/:code`,
    safeWrap(require('./helpers/githubAuthenticate').default),
  )
  app.put(
    `/tenant/:tenantId/integration/:id/github/repos`,
    safeWrap(require('./helpers/githubMapRepos').default),
  )
  app.get(
    `/tenant/:tenantId/integration/:id/github/repos`,
    safeWrap(require('./helpers/githubMapReposGet').default),
  )
  app.put(
    `/discord-authenticate/:tenantId/:guild_id`,
    safeWrap(require('./helpers/discordAuthenticate').default),
  )
  app.put(`/reddit-onboard/:tenantId`, safeWrap(require('./helpers/redditOnboard').default))
  app.put('/linkedin-connect/:tenantId', safeWrap(require('./helpers/linkedinConnect').default))
  app.post('/linkedin-onboard/:tenantId', safeWrap(require('./helpers/linkedinOnboard').default))

  app.post(
    `/tenant/:tenantId/integration/progress/list`,
    safeWrap(require('./integrationProgressList').default),
  )

  app.get(
    `/tenant/:tenantId/integration/progress/:id`,
    safeWrap(require('./integrationProgress').default),
  )

  // Git
  app.put(`/tenant/:tenantId/git-connect`, safeWrap(require('./helpers/gitAuthenticate').default))
  app.get('/tenant/:tenantId/git', safeWrap(require('./helpers/gitGetRemotes').default))
  app.put(
    `/tenant/:tenantId/confluence-connect`,
    safeWrap(require('./helpers/confluenceAuthenticate').default),
  )
  app.put(
    `/tenant/:tenantId/gerrit-connect`,
    safeWrap(require('./helpers/gerritAuthenticate').default),
  )
  app.get(
    '/tenant/:tenantId/devto-validate',
    safeWrap(require('./helpers/devtoValidators').default),
  )
  app.get(
    '/tenant/:tenantId/reddit-validate',
    safeWrap(require('./helpers/redditValidator').default),
  )
  app.post(
    '/tenant/:tenantId/devto-connect',
    safeWrap(require('./helpers/devtoCreateOrUpdate').default),
  )
  app.post(
    '/tenant/:tenantId/hackernews-connect',
    safeWrap(require('./helpers/hackerNewsCreateOrUpdate').default),
  )

  app.post(
    '/tenant/:tenantId/stackoverflow-connect',
    safeWrap(require('./helpers/stackOverflowCreateOrUpdate').default),
  )
  app.get(
    '/tenant/:tenantId/stackoverflow-validate',
    safeWrap(require('./helpers/stackOverflowValidator').default),
  )
  app.get(
    '/tenant/:tenantId/stackoverflow-volume',
    safeWrap(require('./helpers/stackOverflowVolume').default),
  )

  app.post(
    '/tenant/:tenantId/discourse-connect',
    safeWrap(require('./helpers/discourseCreateOrUpdate').default),
  )

  app.post(
    '/tenant/:tenantId/discourse-validate',
    safeWrap(require('./helpers/discourseValidator').default),
  )

  app.post(
    '/tenant/:tenantId/discourse-test-webhook',
    safeWrap(require('./helpers/discourseTestWebhook').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-connect',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotConnect').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-onboard',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotOnboard').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-update-properties',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotUpdateProperties').default),
  )

  app.get(
    '/tenant/:tenantId/hubspot-mappable-fields',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotGetMappableFields').default),
  )

  app.get(
    '/tenant/:tenantId/hubspot-get-lists',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotGetLists').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-sync-member',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotSyncMember').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-stop-sync-member',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotStopSyncMember').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-sync-organization',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotSyncOrganization').default),
  )

  app.post(
    '/tenant/:tenantId/hubspot-stop-sync-organization',
    featureFlagMiddleware(FeatureFlag.HUBSPOT, 'hubspot.errors.notInPlan'),
    safeWrap(require('./helpers/hubspotStopSyncOrganization').default),
  )

  app.post(
    '/tenant/:tenantId/groupsio-connect',
    safeWrap(require('./helpers/groupsioConnectOrUpdate').default),
  )

  app.post(
    '/tenant/:tenantId/groupsio-get-token',
    safeWrap(require('./helpers/groupsioGetToken').default),
  )

  app.post(
    '/tenant/:tenantId/groupsio-verify-group',
    safeWrap(require('./helpers/groupsioVerifyGroup').default),
  )

  app.post(
    '/tenant/:tenantId/groupsio-get-user-subscriptions',
    safeWrap(require('./helpers/groupsioGetUserSubscriptions').default),
  )

  app.post(
    '/tenant/:tenantId/jira-connect',
    safeWrap(require('./helpers/jiraConnectOrUpdate').default),
  )

  app.get(
    '/tenant/:tenantId/github-installations',
    safeWrap(require('./helpers/getGithubInstallations').default),
  )

  app.post(
    '/tenant/:tenantId/github-connect-installation',
    safeWrap(require('./helpers/githubConnectInstallation').default),
  )

  app.get('/gitlab/:tenantId/connect', safeWrap(require('./helpers/gitlabAuthenticate').default))

  app.get(
    '/gitlab/:tenantId/callback',
    safeWrap(require('./helpers/gitlabAuthenticateCallback').default),
  )

  app.put(
    `/tenant/:tenantId/integration/:id/gitlab/repos`,
    safeWrap(require('./helpers/gitlabMapRepos').default),
  )
  app.get(
    `/tenant/:tenantId/integration/:id/gitlab/repos`,
    safeWrap(require('./helpers/gitlabMapReposGet').default),
  )

  if (TWITTER_CONFIG.clientId) {
    /**
     * Using the passport.authenticate this endpoint forces a
     * redirect to happen to the twitter oauth2 page.
     * We keep a state of the important variables such as tenantId, redirectUrl, ..
     * so that after user logs in through the twitter page, these
     * variables are forwarded back to the callback as well
     * This state is sent using the authenticator options and
     * manipulated through twitterStrategy.staticPKCEStore
     */
    app.get(
      '/twitter/:tenantId/connect',
      safeWrap(require('./helpers/twitterAuthenticate').default),
      () => {
        // The request will be redirected for authentication, so this
        // function will not be called.
      },
    )

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
      // passport.authenticate('twitter', {
      //   session: false,
      //   failureRedirect: `${API_CONFIG.frontendUrl}/integrations?error=true`,
      // }),
      async (req, _res, next) => {
        const stateQueryParam = req.query.state
        const decodedState = decodeBase64Url(stateQueryParam)
        req.state = JSON.parse(decodedState)
        next()
      },
      (req, _res, next) => {
        const { crowdToken } = req.state
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = req.state
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      async (req, _res, next) => {
        const cache = new RedisCache('twitterPKCE', req.redis, req.log)
        const state = await cache.get(req.currentUser.id)
        const { segmentIds } = JSON.parse(state)
        const segmentRepository = new SegmentRepository(req)
        req.currentSegments = await segmentRepository.findInIds(segmentIds)
        next()
      },
      safeWrap(require('./helpers/twitterAuthenticateCallback').default),
    )
  }

  /**
   * Slack integration endpoints
   * These should be super similar to Twitter's, since we're also using passport.js
   */
  if (SLACK_CONFIG.clientId) {
    // path to start the OAuth flow
    app.get('/slack/:tenantId/connect', safeWrap(require('./helpers/slackAuthenticate').default))

    // OAuth callback url
    app.get(
      '/slack/callback',
      passport.authorize('slack', {
        session: false,
        failureRedirect: `${API_CONFIG.frontendUrl}/integrations?error=true`,
      }),
      async (req, _res, next) => {
        req.state = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        next()
      },
      (req, _res, next) => {
        const { crowdToken } = req.state
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = req.state
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      async (req, _res, next) => {
        const { segmentIds } = req.state
        const segmentRepository = new SegmentRepository(req)
        req.currentSegments = await segmentRepository.findInIds(segmentIds)
        next()
      },
      safeWrap(require('./helpers/slackAuthenticateCallback').default),
    )
  }
}
