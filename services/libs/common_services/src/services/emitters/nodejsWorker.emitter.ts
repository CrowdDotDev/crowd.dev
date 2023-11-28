import { generateUUIDv1 } from '@crowd/common'
import { UnleashClient } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { CrowdQueue, NODEJS_WORKER_QUEUE_SETTINGS, SqsClient } from '@crowd/sqs'
import { Tracer } from '@crowd/tracing'
import {
  AutomationType,
  BulkEnrichQueueMessage,
  EagleEyeEmailDigestQueueMessage,
  EnrichOrganizationQueueMessage,
  ExportCSVQueueMessage,
  ExportableEntity,
  IntegrationDataCheckerQueueMessage,
  MergeSuggestionsQueueMessage,
  NewActivityAutomationQueueMessage,
  NewMemberAutomationQueueMessage,
  OrgMergeQueueMessage,
  ProcessAutomationQueueMessage,
  QueuePriorityLevel,
  RefreshSampleDataQueueMessage,
  SendgridWebhookQueueMessage,
  StripeWebhookQueueMessage,
  WeeklyAnalyticsEmailQueueMessage,
} from '@crowd/types'
import { QueuePriorityContextLoader, QueuePriorityService } from '../priority.service'

/* eslint-disable @typescript-eslint/no-explicit-any */

export class NodejsWorkerEmitter extends QueuePriorityService {
  public constructor(
    sqsClient: SqsClient,
    redis: RedisClient,
    tracer: Tracer,
    unleash: UnleashClient | undefined,
    priorityLevelCalculationContextLoader: QueuePriorityContextLoader,
    parentLog: Logger,
  ) {
    super(
      CrowdQueue.NODEJS_WORKER,
      NODEJS_WORKER_QUEUE_SETTINGS,
      sqsClient,
      redis,
      tracer,
      unleash,
      priorityLevelCalculationContextLoader,
      parentLog,
    )
  }

  public async processAutomationForNewActivity(
    tenantId: string,
    activityId: string,
    segmentId: string,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      `${activityId}--${segmentId}`,
      new NewActivityAutomationQueueMessage(tenantId, activityId, segmentId),
      `${activityId}--${segmentId}`,
    )
  }

  public async processAutomationForNewMember(
    tenantId: string,
    memberId: string,
    segmentId: string,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      memberId,
      new NewMemberAutomationQueueMessage(tenantId, memberId, segmentId),
      memberId,
    )
  }

  public async bulkEnrich(
    tenantId: string,
    memberIds: string[],
    segmentIds: string[],
    notifyFrontend = true,
    skipCredits = false,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new BulkEnrichQueueMessage(tenantId, memberIds, segmentIds, notifyFrontend, skipCredits),
    )
  }

  public async mergeOrg(
    tenantId: string,
    primaryOrgId: string,
    secondaryOrgId: string,
    notifyFrontend = true,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new OrgMergeQueueMessage(tenantId, primaryOrgId, secondaryOrgId, notifyFrontend),
    )
  }

  public async exportCSV(
    tenantId: string,
    user: string,
    entity: ExportableEntity,
    segmentIds: string[],
    criteria: any,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new ExportCSVQueueMessage(user, tenantId, entity, segmentIds, criteria),
    )
  }

  public async eagleEyeEmailDigest(tenantId: string, user: string): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new EagleEyeEmailDigestQueueMessage(tenantId, user),
    )
  }

  public async integrationDataChecker(tenantId: string, integrationId: string): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new IntegrationDataCheckerQueueMessage(tenantId, integrationId),
    )
  }

  public async processAutomation(
    tenantId: string,
    type: AutomationType,
    automation: any,
    eventId: string,
    payload: any,
  ): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new ProcessAutomationQueueMessage(tenantId, type, automation, eventId, payload),
    )
  }

  public async weeklyAnalyticsEmail(tenantId: string): Promise<void> {
    await this.sendMessage(
      tenantId,
      generateUUIDv1(),
      new WeeklyAnalyticsEmailQueueMessage(tenantId),
    )
  }

  public async stripeWebhook(event: any): Promise<void> {
    await this.sendMessage(
      undefined,
      generateUUIDv1(),
      new StripeWebhookQueueMessage(event),
      undefined,
      undefined,
      QueuePriorityLevel.GLOBAL,
    )
  }

  public async sendgridWebhook(event: any): Promise<void> {
    await this.sendMessage(
      undefined,
      generateUUIDv1(),
      new SendgridWebhookQueueMessage(event),
      undefined,
      undefined,
      QueuePriorityLevel.GLOBAL,
    )
  }

  public async refreshSampleData(): Promise<void> {
    await this.sendMessage(
      undefined,
      generateUUIDv1(),
      new RefreshSampleDataQueueMessage(),
      undefined,
      undefined,
      QueuePriorityLevel.GLOBAL,
    )
  }

  public async enrichOrganizations(tenantId: string, maxEnrichLimit = 0): Promise<void> {
    await this.sendMessage(
      tenantId,
      tenantId,
      new EnrichOrganizationQueueMessage(tenantId, maxEnrichLimit),
    )
  }

  public async mergeSuggestions(tenantId: string): Promise<void> {
    await this.sendMessage(tenantId, tenantId, new MergeSuggestionsQueueMessage(tenantId))
  }
}
