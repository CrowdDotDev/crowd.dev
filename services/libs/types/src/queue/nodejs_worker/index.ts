import { AutomationTrigger, AutomationType } from '../../automations'
import { IQueueMessage } from '../'

/* eslint-disable @typescript-eslint/no-explicit-any */

export enum NodejsWorkerQueueMessageType {
  NODE_MICROSERVICE = 'node_microservice',
}

export enum ExportableEntity {
  MEMBERS = 'members',
}

export class NewActivityAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly trigger = AutomationTrigger.NEW_ACTIVITY
  public readonly service = 'automation'

  constructor(
    public readonly tenant: string,
    public readonly activityId: string,
    public readonly segmentId: string,
  ) {}
}

export class NewMemberAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly trigger = AutomationTrigger.NEW_MEMBER
  public readonly service = 'automation'

  constructor(
    public readonly tenant: string,
    public readonly memberId: string,
    public readonly segmentId: string,
  ) {}
}

export class ProcessAutomationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'automation-process'

  constructor(
    public readonly tenant: string,
    public readonly automationType: AutomationType,
    public readonly automation: any,
    public readonly eventId: string,
    public readonly payload: any,
  ) {}
}

export class BulkEnrichQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'bulk-enrich'

  constructor(
    public readonly tenant: string,
    public readonly memberIds: string[],
    public readonly segmentIds: string[],
    public readonly notifyFrontend: boolean,
    public readonly skipCredits: boolean,
  ) {}
}

export class OrgMergeQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'org-merge'

  constructor(
    public readonly tenantId: string,
    public readonly primaryOrgId: string,
    public readonly secondaryOrgId: string,
    public readonly notifyFrontend: boolean,
  ) {}
}

export class ExportCSVQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'csv-export'

  constructor(
    public readonly user: string,
    public readonly tenant: string,
    public readonly entity: ExportableEntity,
    public readonly segmentIds: string[],
    public readonly criteria: any,
  ) {}
}

export class EagleEyeEmailDigestQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'eagle-eye-email-digest'

  constructor(public readonly tenant: string, public readonly user: string) {}
}

export class IntegrationDataCheckerQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'integration-data-checker'

  constructor(public readonly tenantId: string, public readonly integrationId: string) {}
}

export class WeeklyAnalyticsEmailQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'weekly-analytics-emails'

  constructor(public readonly tenant: string) {}
}

export class StripeWebhookQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'stripe-webhooks'

  constructor(public readonly event: any) {}
}

export class SendgridWebhookQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'sendgrid-webhooks'

  constructor(public readonly event: any) {}
}

export class RefreshSampleDataQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'refresh-sample-data'
}

export class EnrichOrganizationQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'enrich-organizations'

  constructor(public readonly tenantId: string, public readonly maxEnrichLimit: number) {}
}

export class MergeSuggestionsQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'merge-suggestions'

  constructor(public readonly tenant: string) {}
}
