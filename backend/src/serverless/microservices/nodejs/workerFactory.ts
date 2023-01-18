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
} from './messageTypes'
import { AutomationTrigger, AutomationType } from '../../../types/automationTypes'
import newActivityWorker from './automation/workers/newActivityWorker'
import newMemberWorker from './automation/workers/newMemberWorker'
import webhookWorker from './automation/workers/webhookWorker'
import { csvExportWorker } from './csv-export/csvExportWorker'
import { processWebhook } from '../../integrations/workers/stripeWebhookWorker'

/**
 * Worker factory for spawning different microservices
 * according to event.service
 * @param event
 * @returns worker function promise
 */

async function workerFactory(event: NodeMicroserviceMessage): Promise<any> {
  const { service, tenant } = event as any

  switch (service.toLowerCase()) {
    case 'stripe-webhooks':
      return processWebhook(event)
    case 'weekly-analytics-emails':
      return weeklyAnalyticsEmailsWorker(tenant)
    case 'csv-export':
      const csvExportMessage = event as CsvExportMessage
      return csvExportWorker(
        csvExportMessage.entity,
        csvExportMessage.user,
        tenant,
        csvExportMessage.criteria,
      )
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
