/* eslint-disable no-case-declarations */
import {
  NodeMicroserviceMessage,
  BulkEnrichMessage,
  OrganizationBulkEnrichMessage,
} from './messageTypes'
import { processStripeWebhook } from '../../integrations/workers/stripeWebhookWorker'
import { processSendgridWebhook } from '../../integrations/workers/sendgridWebhookWorker'
import { bulkEnrichmentWorker } from './bulk-enrichment/bulkEnrichmentWorker'
import { BulkorganizationEnrichmentWorker } from './bulk-enrichment/bulkOrganizationEnrichmentWorker'

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

    case 'bulk-enrich':
      const bulkEnrichMessage = event as BulkEnrichMessage
      return bulkEnrichmentWorker(
        bulkEnrichMessage.tenant,
        bulkEnrichMessage.memberIds,
        bulkEnrichMessage.segmentIds,
        bulkEnrichMessage.notifyFrontend,
        bulkEnrichMessage.skipCredits,
      )
    case 'enrich-organizations': {
      const bulkEnrichMessage = event as OrganizationBulkEnrichMessage
      return BulkorganizationEnrichmentWorker(
        bulkEnrichMessage.tenantId,
        bulkEnrichMessage.maxEnrichLimit,
      )
    }

    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
