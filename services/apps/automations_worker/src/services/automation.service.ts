import { DbStore } from '@crowd/database'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import {
  AutomationExecutionState,
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewActivitySettings,
  NewMemberSettings,
  WebhookSettings,
} from '@crowd/types'
import { AutomationRepository, IRelevantAutomationData } from '../repos/automation.repo'
import request from 'superagent'
import { newMemberBlocks } from './slack/newMemberBlocks'
import { newActivityBlocks } from './slack/newActivityBlocks'
import { IMemberData, IActivityData } from '../repos/types'
import { DataRepository } from '../repos/data.repo'

export class AutomationService {
  private readonly log: Logger
  private readonly automationRepo: AutomationRepository
  private readonly dataRepo: DataRepository

  private readonly automationCache: RedisCache
  private readonly memberCache: RedisCache
  private readonly activityCache: RedisCache

  constructor(dbStore: DbStore, redis: RedisClient, parentLog: Logger) {
    this.log = getChildLogger(this.constructor.name, parentLog)

    this.automationRepo = new AutomationRepository(dbStore, this.log)
    this.dataRepo = new DataRepository(dbStore, this.log)

    this.automationCache = new RedisCache('automations:definitions', redis, this.log)
    this.memberCache = new RedisCache('automations:members', redis, this.log)
    this.activityCache = new RedisCache('automations:activities', redis, this.log)
  }

  async shouldProcessMember(
    member: IMemberData,
    automation: IRelevantAutomationData,
  ): Promise<boolean> {
    const settings = automation.settings as NewMemberSettings

    let process = true

    // check whether member platforms matches
    if (settings.platforms && settings.platforms.length > 0) {
      const platforms = Object.keys(member.username)
      if (!platforms.some((platform) => settings.platforms.includes(platform))) {
        this.log.warn(
          `Ignoring automation ${automation.id} - Member ${
            member.id
          } platforms do not include any of automation setting platforms: [${settings.platforms.join(
            ', ',
          )}]`,
        )
        process = false
      }
    }

    if (process) {
      const hasAlreadyBeenTriggered = await this.automationRepo.hasAlreadyBeenTriggered(
        automation.id,
        member.id,
      )
      if (hasAlreadyBeenTriggered) {
        this.log.warn(
          `Ignoring automation ${automation.id} - Member ${member.id} was already processed!`,
        )
        process = false
      }
    }

    return process
  }

  async shouldProcessActivity(
    activity: IActivityData,
    automation: IRelevantAutomationData,
  ): Promise<boolean> {
    const settings = automation.settings as NewActivitySettings

    let process = true

    // check whether activity type matches
    if (settings.types && settings.types.length > 0) {
      if (!settings.types.includes(activity.type)) {
        this.log.warn(
          `Ignoring automation ${automation.id} - Activity ${activity.id} type '${
            activity.type
          }' does not match automation setting types: [${settings.types.join(', ')}]`,
        )
        process = false
      }
    }

    // check whether activity platform matches
    if (process && settings.platforms && settings.platforms.length > 0) {
      if (!settings.platforms.includes(activity.platform)) {
        this.log.warn(
          `Ignoring automation ${automation.id} - Activity ${activity.id} platform '${
            activity.platform
          }' does not match automation setting platforms: [${settings.platforms.join(', ')}]`,
        )
        process = false
      }
    }

    // check whether activity content contains any of the keywords
    if (process && settings.keywords && settings.keywords.length > 0) {
      const body = (activity.body as string).toLowerCase()
      if (!settings.keywords.some((keyword) => body.includes(keyword.trim().toLowerCase()))) {
        this.log.warn(
          `Ignoring automation ${automation.id} - Activity ${
            activity.id
          } content does not match automation setting keywords: [${settings.keywords.join(', ')}]`,
        )
        process = false
      }
    }

    if (
      process &&
      !settings.teamMemberActivities &&
      activity.member.attributes.isTeamMember &&
      activity.member.attributes.isTeamMember.default
    ) {
      this.log.warn(
        `Ignoring automation ${automation.id} - Activity ${activity.id} belongs to a team member!`,
      )
      process = false
    }

    if (activity?.member?.attributes?.isBot && activity?.member?.attributes?.isBot.default) {
      this.log.warn(
        `Ignoring automation ${automation.id} - Activity ${activity.id} belongs to a bot, cannot be processed automaticaly!`,
      )
      process = false
    }

    if (process) {
      const hasAlreadyBeenTriggered = await this.automationRepo.hasAlreadyBeenTriggered(
        automation.id,
        activity.id,
      )
      if (hasAlreadyBeenTriggered) {
        this.log.warn(
          `Ignoring automation ${automation.id} - Activity ${activity.id} was already processed!`,
        )
        process = false
      }
    }

    return process
  }

  /**
   * @returns automation ids to trigger
   */
  async detectNewMemberAutomations(tenantId: string, memberId: string): Promise<string[]> {
    this.log.debug('Detecting new member automations!')

    // load automations for this tenant and this type from database
    const relevantAutomations = await this.automationRepo.findRelevant(
      tenantId,
      AutomationTrigger.NEW_MEMBER,
      AutomationState.ACTIVE,
    )

    if (relevantAutomations.length > 0) {
      this.log.info(`Found ${relevantAutomations.length} automations to process!`)

      const automationsToTrigger = []

      const member = await this.getMember(memberId)

      if (!member) {
        throw new Error(`Member ${memberId} not found!`)
      }

      const promises = relevantAutomations.map((a) => this.shouldProcessMember(member, a))
      const results = await Promise.all(promises)
      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          const automation = relevantAutomations[i]
          this.log.info({ automationId: automation.id }, 'Automation should be processed!')

          await this.cacheAutomation(automation)
          automationsToTrigger.push(automation.id)
        }
      }

      if (automationsToTrigger.length > 0) {
        await this.cacheMember(member)
      }

      return automationsToTrigger
    }

    return []
  }

  /**
   * @returns automation ids to trigger
   */
  async detectNewActivityAutomations(tenantId: string, activityId: string): Promise<string[]> {
    this.log.debug('Detecting new member automations!')

    // load automations for this tenant and this type from database
    const relevantAutomations = await this.automationRepo.findRelevant(
      tenantId,
      AutomationTrigger.NEW_ACTIVITY,
      AutomationState.ACTIVE,
    )

    if (relevantAutomations.length > 0) {
      this.log.info(`Found ${relevantAutomations.length} automations to process!`)

      const automationsToTrigger = []

      const activity = await this.getActivity(activityId)

      if (!activity) {
        throw new Error(`Activity ${activityId} not found!`)
      }

      const promises = relevantAutomations.map((a) => this.shouldProcessActivity(activity, a))
      const results = await Promise.all(promises)
      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          const automation = relevantAutomations[i]
          this.log.info({ automationId: automation.id }, 'Automation should be processed!')

          await this.cacheAutomation(automation)
          automationsToTrigger.push(automation.id)
        }
      }

      if (automationsToTrigger.length > 0) {
        await this.cacheActivity(activity)
      }

      return automationsToTrigger
    }

    return []
  }

  async triggerAutomationExecution(
    automationId: string,
    eventId: string,
    payload: unknown,
  ): Promise<void> {
    this.log.info('Triggering automation execution!')

    const automation = await this.getAutomation(automationId)

    if (!automation) {
      this.log.warn('Automation not found!')
      return
    }

    let executeMethod: (
      automation: IRelevantAutomationData,
      eventId: string,
      payload: unknown,
    ) => Promise<void>

    switch (automation.type) {
      case AutomationType.WEBHOOK: {
        executeMethod = this.executeWebhook
        break
      }

      case AutomationType.SLACK: {
        executeMethod = this.executeSlack
        break
      }
      default:
        this.log.error(`Automation type '${automation.type}' is not supported!`)
        return
    }

    try {
      executeMethod(automation, eventId, payload)
      await this.automationRepo.createExecution({
        automationId: automation.id,
        type: automation.type,
        trigger: automation.trigger,
        tenantId: automation.tenantId,
        executedAt: new Date(),
        state: AutomationExecutionState.SUCCESS,
        eventId,
        payload,
        error: undefined,
      })
    } catch (err) {
      this.log.error(err, 'Error while executing automation!')
      await this.automationRepo.createExecution({
        automationId: automation.id,
        type: automation.type,
        trigger: automation.trigger,
        tenantId: automation.tenantId,
        executedAt: new Date(),
        state: AutomationExecutionState.ERROR,
        eventId,
        payload,
        error: err,
      })
      throw err
    }
  }

  private async executeWebhook(
    automation: IRelevantAutomationData,
    eventId: string,
    payload: unknown,
  ): Promise<void> {
    const settings = automation.settings as WebhookSettings
    const now = new Date()

    this.log.info('Firing webhook automation!')
    const eventPayload = {
      eventId,
      eventType: automation.trigger,
      eventExecutedAt: now.toISOString(),
      eventPayload: payload,
    }

    try {
      const result = await request
        .post(settings.url)
        .send(eventPayload)
        .set('User-Agent', 'Crowd.dev Automations Executor')
        .set('X-CrowdDotDev-Event-Type', automation.trigger)
        .set('X-CrowdDotDev-Event-ID', eventId)
      this.log.debug(`Webhook response code ${result.statusCode}!`)
    } catch (err) {
      this.log.error(
        err,
        `Error while firing webhook automation ${automation.id} for event ${eventId} to url '${settings.url}'!`,
      )

      let error: Record<string, unknown>

      if (err.syscall && err.code) {
        error = {
          type: 'network',
          message: `Could not access ${settings.url}!`,
        }
      } else if (err.status) {
        error = {
          type: 'http_status',
          message: `POST @ ${settings.url} returned ${err.statusCode} - ${err.statusMessage}!`,
          body: err.res !== undefined ? err.res.body : undefined,
        }
      } else {
        error = {
          type: 'unknown',
          message: err.message,
          errorObject: err,
        }
      }

      throw error
    }
  }

  private async executeSlack(
    automation: IRelevantAutomationData,
    eventId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    this.log.info(`Firing slack automation ${automation.id} for event ${eventId}!`)

    if (!automation.slackWebHook) {
      throw new Error(
        `Automation ${automation.id} does not have a slack webhook set in tenant settings!`,
      )
    }

    try {
      let slackMessage: Record<string, unknown>
      if (automation.trigger === AutomationTrigger.NEW_MEMBER) {
        slackMessage = {
          text: `${payload.displayName} has joined your community!`,
          ...newMemberBlocks(payload),
        }
      } else if (automation.trigger === AutomationTrigger.NEW_ACTIVITY) {
        slackMessage = {
          text: ':satellite_antenna: New activity',
          ...newActivityBlocks(payload),
        }
      } else {
        this.log.warn(`Error no slack handler for automation trigger ${automation.trigger}!`)
        return
      }

      const result = await request.post(automation.slackWebHook).send(slackMessage)
      this.log.debug(`Slack response code ${result.statusCode}!`)
    } catch (err) {
      this.log.error(
        err,
        `Error while firing slack automation ${automation.id} for event ${eventId}!`,
      )

      let error: Record<string, unknown>

      if (err.status === 404) {
        error = {
          type: 'connect',
          message: `Could not access slack workspace!`,
        }
      } else {
        error = {
          type: 'connect',
        }
      }

      throw error
    }
  }

  private async cacheAutomation(automation: IRelevantAutomationData): Promise<void> {
    await this.automationCache.set(automation.id, JSON.stringify(automation), 60)
  }

  private async getAutomation(automationId: string): Promise<IRelevantAutomationData | null> {
    const cached = await this.automationCache.get(automationId)
    if (!cached) {
      const automation = await this.automationRepo.get(automationId)
      if (!automation) {
        return null
      }

      return automation
    }

    return JSON.parse(cached)
  }

  private async cacheMember(member: IMemberData): Promise<void> {
    await this.memberCache.set(member.id, JSON.stringify(member), 60)
  }

  async getMember(memberId: string): Promise<IMemberData | null> {
    const cached = await this.memberCache.get(memberId)
    if (!cached) {
      const members = await this.dataRepo.getMembers([memberId])
      if (members.length === 0) {
        return null
      }

      return members[0]
    }

    return JSON.parse(cached)
  }

  private async cacheActivity(activity: IActivityData): Promise<void> {
    await this.activityCache.set(activity.id, JSON.stringify(activity), 60)
  }

  async getActivity(activityId: string): Promise<IActivityData | null> {
    const cached = await this.activityCache.get(activityId)
    if (!cached) {
      const activities = await this.dataRepo.getActivities([activityId])
      if (activities.length === 0) {
        return null
      }

      return activities[0]
    }

    return JSON.parse(cached)
  }
}
