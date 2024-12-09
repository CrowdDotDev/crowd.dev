import express from 'express'

import { Error400BadRequest } from '@crowd/common'
import { WebhooksRepository } from '@crowd/data-access-layer/src/old/apps/webhook_api/webhooks.repo'
import { PlatformType, WebhookType } from '@crowd/types'

import { asyncWrap } from '../middleware/error'

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

      if (event === 'installation') {
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
