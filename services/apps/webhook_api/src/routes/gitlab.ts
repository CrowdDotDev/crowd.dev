import { asyncWrap } from '../middleware/error'
import { WebhooksRepository } from '@crowd/data-access-layer/src/old/apps/webhook_api/webhooks.repo'
import { WebhookType } from '@crowd/types'
import express from 'express'

export const installGitlabRoutes = async (app: express.Express) => {
  app.post(
    '/gitlab/:integrationId',
    asyncWrap(async (req, res) => {
      // load integration from database to verify that it exists
      const repo = new WebhooksRepository(req.dbStore, req.log)
      const integration = await repo.findIntegrationById(req.params.integrationId)

      if (integration) {
        const id = await repo.createIncomingWebhook(
          integration.tenantId,
          integration.id,
          WebhookType.GITLAB,
          {
            data: req.body,
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
