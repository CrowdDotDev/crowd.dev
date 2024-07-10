import { IQueueMessage } from '../'

/* eslint-disable @typescript-eslint/no-explicit-any */

export enum NodejsWorkerQueueMessageType {
  NODE_MICROSERVICE = 'node_microservice',
}

export enum ExportableEntity {
  MEMBERS = 'members',
  ORGANIZATIONS = 'organizations',
}

export class EagleEyeEmailDigestQueueMessage implements IQueueMessage {
  public readonly type: string = NodejsWorkerQueueMessageType.NODE_MICROSERVICE
  public readonly service = 'eagle-eye-email-digest'

  constructor(public readonly tenant: string, public readonly user: string) {}
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
