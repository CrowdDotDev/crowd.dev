/* eslint-disable no-case-declarations */
import { processSendgridWebhook } from '../../integrations/workers/sendgridWebhookWorker'
import { processStripeWebhook } from '../../integrations/workers/stripeWebhookWorker'
import { csvExportWorker } from './csv-export/csvExportWorker'
import { integrationDataCheckerWorker } from './integration-data-checker/integrationDataCheckerWorker'
import { refreshSampleDataWorker } from './integration-data-checker/refreshSampleDataWorker'
import {
  CsvExportMessage,
  IntegrationDataCheckerMessage,
  NodeMicroserviceMessage,
} from './messageTypes'

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

    case 'integration-data-checker':
      const integrationDataCheckerMessage = event as IntegrationDataCheckerMessage
      return integrationDataCheckerWorker(
        integrationDataCheckerMessage.integrationId,
        integrationDataCheckerMessage.tenantId,
      )

    case 'refresh-sample-data':
      return refreshSampleDataWorker()

    case 'csv-export':
      const csvExportMessage = event as CsvExportMessage
      return csvExportWorker(
        csvExportMessage.entity,
        csvExportMessage.user,
        tenant,
        csvExportMessage.segmentIds,
        csvExportMessage.criteria,
      )

    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
