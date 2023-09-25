import { asyncWrap } from '@/middleware/error'
import { WebhooksRepository } from '@/repos/webhooks.repo'
import { Error400BadRequest } from '@crowd/common'
import { IntegrationStreamWorkerEmitter } from '@crowd/sqs'
import { PlatformType, WebhookType } from '@crowd/types'
import express from 'express'

const SIGNATURE_HEADER = 'x-hub-signature'
const EVENT_HEADER = 'x-github-event'

export const installGithubRoutes = async (app: express.Express) => {
  let emitter: IntegrationStreamWorkerEmitter
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
      // load integration from database to verify that it exists
      const repo = new WebhooksRepository(req.dbStore, req.log)
      const integration = await repo.findIntegrationByIdentifier(PlatformType.GITHUB, identifier)

      if (integration) {
        req.log.info({ integrationId: integration.id }, 'Incoming GitHub Webhook!')

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

        if (!emitter) {
          emitter = new IntegrationStreamWorkerEmitter(req.sqs, req.log)
          await emitter.init()
        }

        await emitter.triggerWebhookProcessing(integration.tenantId, integration.platform, id)

        res.sendStatus(204)
      } else {
        res.sendStatus(200)
      }
    }),
  )
}
