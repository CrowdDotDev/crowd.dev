import { asyncWrap } from '../middleware/error'
import { WebhooksRepository } from '@crowd/data-access-layer/src/old/apps/webhook_api/webhooks.repo'
import { Error400BadRequest } from '@crowd/common'
import { PlatformType, WebhookType } from '@crowd/types'
import express from 'express'

const SIGNATURE_HEADER = 'x-hub-signature'
const EVENT_HEADER = 'x-github-event'

export const installGithubRoutes = async (app: express.Express) => {
  app.post(
    '/github',
    asyncWrap(async (req, res) => {
      if (!req.headers[SIGNATURE_HEADER]) {
        throw new Error400BadRequest('Missing signature header!')
      }
      const signature = req.headers['x-hub-signature']

      if (!req.headers[EVENT_HEADER]) {
        throw new Error400BadRequest('Missing event header!')
      }
      const event = req.headers['x-github-event']

      const data = req.body
      if (!data.installation?.id) {
        throw new Error400BadRequest('Missing installation id!')
      }
      const identifier = data.installation.id.toString()
      const repo = new WebhooksRepository(req.dbStore, req.log)

      if (event === 'installation' && data.action === 'created') {
        await repo.addGithubInstallation(
          identifier,
          data.installation.account.type,
          data.installation.account.login,
          data.installation.account.avatar_url,
          data.repositories.length,
        )
        res.sendStatus(204)
        return
      }
      if (event === 'installation' && data.action === 'deleted') {
        await repo.deleteGithubInstallation(identifier)
        res.sendStatus(204)
        return
      }

      // load integration from database to verify that it exists
      const integration = await repo.findIntegrationByIdentifier(PlatformType.GITHUB, identifier)

      if (integration) {
        const id = await repo.createIncomingWebhook(
          integration.tenantId,
          integration.id,
          WebhookType.GITHUB,
          {
            signature,
            event,
            data,
            date: new Date().toISOString(),
          },
        )

        await req.emitters.integrationStreamWorker.triggerWebhookProcessing(
          integration.tenantId,
          integration.platform,
          id,
        )

        res.sendStatus(204)
      } else {
        res.sendStatus(200)
      }
    }),
  )
}
