/* eslint-disable no-case-declarations */
import { AutomationTrigger, AutomationType, Edition, FeatureFlag } from '@crowd/types'
import { getUnleashClient, isFeatureEnabled } from '@crowd/feature-flags'
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
import { BulkorganizationEnrichmentWorker } from './bulk-enrichment/bulkOrganizationEnrichmentWorker'
import { API_CONFIG, UNLEASH_CONFIG } from '../../../conf'

/**
 * Worker factory for spawning different microservices
 * according to event.service
 * @param event
 * @returns worker function promise
 */

async function workerFactory(event: NodeMicroserviceMessage): Promise<any> {
  const unleash = await getUnleashClient({
    url: UNLEASH_CONFIG.url,
    appName: event.service,
    apiKey: UNLEASH_CONFIG.backendApiKey,
  })

  const { service, tenant } = event as any
  switch (service.toLowerCase()) {
    case 'stripe-webhooks':
      return processStripeWebhook(event)
    case 'sendgrid-webhooks':
      return processSendgridWebhook(event)
    case 'weekly-analytics-emails':
      return weeklyAnalyticsEmailsWorker(tenant)
    case 'eagle-eye-email-digest':
      if (
        isFeatureEnabled(
          FeatureFlag.TEMPORAL_EMAILS,
          async () => ({
            tenant,
          }),
          unleash,
        )
      ) {
        return {}
      }

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
        csvExportMessage.segmentIds,
        csvExportMessage.criteria,
      )
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
    case 'automation-process':
      if (API_CONFIG.edition === Edition.LFX) {
        return {}
      }
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
      if (API_CONFIG.edition === Edition.LFX) {
        return {}
      }
      const automationRequest = event as AutomationMessage

      switch (automationRequest.trigger) {
        case AutomationTrigger.NEW_ACTIVITY:
          const newActivityAutomationRequest = event as NewActivityAutomationMessage
          return newActivityWorker(
            tenant,
            newActivityAutomationRequest.activityId,
            newActivityAutomationRequest.segmentId,
          )
        case AutomationTrigger.NEW_MEMBER:
          const newMemberAutomationRequest = event as NewMemberAutomationMessage
          return newMemberWorker(
            tenant,
            newMemberAutomationRequest.memberId,
            newMemberAutomationRequest.segmentId,
          )
        default:
          throw new Error(`Invalid automation trigger ${automationRequest.trigger}!`)
      }
    default:
      throw new Error(`Invalid microservice ${service}`)
  }
}

export default workerFactory
