/* eslint-disable no-case-declarations */
import { weeklyAnalyticsEmailsWorker } from './analytics/workers/weeklyAnalyticsEmailsWorker'
import {
  AutomationMessage,
  CsvExportMessage,
  NewActivityAutomationMessage,
  NewMemberAutomationMessage,
  NodeMicroserviceMessage,
  ProcessAutomationMessage,
  ProcessWebhookAutomationMessage,
  BulkEnrichMessage,
  EagleEyeEmailDigestMessage,
  IntegrationDataCheckerMessage,
  OrganizationBulkEnrichMessage,
} from './messageTypes'
import { AutomationTrigger, AutomationType } from '../../../types/automationTypes'
import newActivityWorker from './automation/workers/newActivityWorker'
import newMemberWorker from './automation/workers/newMemberWorker'
import webhookWorker from './automation/workers/webhookWorker'
import slackWorker from './automation/workers/slackWorker'
import { csvExportWorker } from './csv-export/csvExportWorker'
import { processStripeWebhook } from '../../integrations/workers/stripeWebhookWorker'
import { processSendgridWebhook } from '../../integrations/workers/sendgridWebhookWorker'
import { bulkEnrichmentWorker } from './bulk-enrichment/bulkEnrichmentWorker'
import { eagleEyeEmailDigestWorker } from './eagle-eye-email-digest/eagleEyeEmailDigestWorker'
import { integrationDataCheckerWorker } from './integration-data-checker/integrationDataCheckerWorker'
import { refreshSampleDataWorker } from './integration-data-checker/refreshSampleDataWorker'
import { mergeSuggestionsWorker } from './merge-suggestions/mergeSuggestionsWorker'
import { searchEngineUpdate } from './searchEngineUpdate/searchEngineUpdate'
import { BulkorganizationEnrichmentWorker } from './bulk-enrichment/bulkOrganizationEnrichmentWorker'

/**
 * Worker factory for spawning different microservices
 * according to event.service
 * @param event
 * @returns worker function promise
 */

async function workerFactory(event: NodeMicroserviceMessage): Promise<any> {
  const { service, tenant } = event as any
  switch (service.toLowerCase()) {
    case 'search-engine-update':
      return searchEngineUpdate(tenant, (event as any).conversationId)
    case 'stripe-webhooks':
      return processStripeWebhook(event)
    case 'sendgrid-webhooks':
      return processSendgridWebhook(event)
    case 'weekly-analytics-emails':
      return weeklyAnalyticsEmailsWorker(tenant)
    case 'eagle-eye-email-digest':
      const eagleEyeDigestMessage = event as EagleEyeEmailDigestMessage
      return eagleEyeEmailDigestWorker(eagleEyeDigestMessage.user, eagleEyeDigestMessage.tenant)
    case 'integration-data-checker':
      const integrationDataCheckerMessage = event as IntegrationDataCheckerMessage
      return integrationDataCheckerWorker(
        integrationDataCheckerMessage.integrationId,
        integrationDataCheckerMessage.tenantId,
      )
    case 'merge-suggestions':
      return mergeSuggestionsWorker(tenant)

    case 'refresh-sample-data':
      return refreshSampleDataWorker()

    case 'csv-export':
      const csvExportMessage = event as CsvExportMessage
      return csvExportWorker(
        csvExportMessage.entity,
        csvExportMessage.user,
        tenant,
        csvExportMessage.criteria,
      )
    case 'bulk-enrich':
      const bulkEnrichMessage = event as BulkEnrichMessage
      return bulkEnrichmentWorker(bulkEnrichMessage.tenant, bulkEnrichMessage.memberIds)
    case 'enrich-organizations': {
      const bulkEnrichMessage = event as OrganizationBulkEnrichMessage
      return BulkorganizationEnrichmentWorker(bulkEnrichMessage.tenantId)
    }

    case 'automation-process':
      const automationProcessRequest = event as ProcessAutomationMessage

      switch (automationProcessRequest.automationType) {
        case AutomationType.WEBHOOK:
          const webhookProcessRequest = event as ProcessWebhookAutomationMessage
          return webhookWorker(
            tenant,
            webhookProcessRequest.automationId,
            webhookProcessRequest.automation,
            webhookProcessRequest.eventId,
            webhookProcessRequest.payload,
          )
        case AutomationType.SLACK:
          const slackProcessRequest = event as ProcessWebhookAutomationMessage
          return slackWorker(
            tenant,
            slackProcessRequest.automationId,
            slackProcessRequest.automation,
            slackProcessRequest.eventId,
            slackProcessRequest.payload,
          )
        default:
          throw new Error(`Invalid automation type ${automationProcessRequest.automationType}!`)
      }

    case 'automation':
      const automationRequest = event as AutomationMessage

      switch (automationRequest.trigger) {
        case AutomationTrigger.NEW_ACTIVITY:
          const newActivityAutomationRequest = event as NewActivityAutomationMessage
          return newActivityWorker(
            tenant,
            newActivityAutomationRequest.activityId,
            newActivityAutomationRequest.activity,
          )
        case AutomationTrigger.NEW_MEMBER:
          const newMemberAutomationRequest = event as NewMemberAutomationMessage
          return newMemberWorker(
            tenant,
            newMemberAutomationRequest.memberId,
            newMemberAutomationRequest.member,
          )
        default:
          throw new Error(`Invalid automation trigger ${automationRequest.trigger}!`)
      }
    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
