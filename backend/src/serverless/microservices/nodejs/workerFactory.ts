/* eslint-disable no-case-declarations */
import { processSendgridWebhook } from '../../integrations/workers/sendgridWebhookWorker'
import { processStripeWebhook } from '../../integrations/workers/stripeWebhookWorker'
import { NodeMicroserviceMessage } from './messageTypes'

/**
 * Worker factory for spawning different microservices
 * according to event.service
 * @param event
 * @returns worker function promise
 */

async function workerFactory(event: NodeMicroserviceMessage): Promise<any> {
  const { service } = event as any
  switch (service.toLowerCase()) {
    case 'stripe-webhooks':
      return processStripeWebhook(event)
    case 'sendgrid-webhooks':
      return processSendgridWebhook(event)

    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
