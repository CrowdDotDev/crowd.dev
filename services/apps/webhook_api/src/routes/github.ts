import { asyncWrap } from '@/middleware/error'
import { WebhooksRepository } from '@/repos/webhooks.repo'
import { IntegrationStreamWorkerEmitter } from '@crowd/sqs'
import { PlatformType, WebhookType } from '@crowd/types'
import express from 'express'

export const installGithubRoutes = async (app: express.Express) => {
  app.post(
    '/webhooks/github',
    asyncWrap(async (req, res) => {
      const signature = req.headers['x-hub-signature']
      const event = req.headers['x-github-event']
      const data = req.body

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
          },
        )

        const emitter = new IntegrationStreamWorkerEmitter(req.sqs, req.log)
        await emitter.triggerWebhookProcessing(integration.tenantId, integration.platform, id)

        res.sendStatus(204)
      } else {
        res.sendStatus(200)
      }
    }),
  )
}
