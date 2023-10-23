import { DbStore } from '@crowd/database'
import { Logger, getChildLogger } from '@crowd/logging'
import { AutomationRepository, IRelevantAutomationData } from '../repos/automation.repo'
import { IMemberData, MemberRepository } from '../repos/member.repo'
import { RedisCache, RedisClient } from '@crowd/redis'
import {
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewMemberSettings,
  WebhookSettings,
} from '@crowd/types'

export class AutomationService {
  private readonly log: Logger
  private readonly automationRepo: AutomationRepository
  private readonly memberRepo: MemberRepository

  private readonly automationCache: RedisCache
  private readonly memberCache: RedisCache

  constructor(dbStore: DbStore, redis: RedisClient, parentLog: Logger) {
    this.log = getChildLogger(this.constructor.name, parentLog)

    this.automationRepo = new AutomationRepository(dbStore, this.log)
    this.memberRepo = new MemberRepository(dbStore, this.log)

    this.automationCache = new RedisCache('automations:definitions', redis, this.log)
    this.memberCache = new RedisCache('automations:members', redis, this.log)
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

  /**
   * @returns automation ids to trigger
   */
  async detectNewMemberAutomations(tenantId: string, memberId: string): Promise<string[]> {
    this.log.debug('Detecting new member automations!')

    // todo load automations for this tenant and this type from database
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
        this.log.warn({ memberId }, 'Member not found!')
        return []
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

  async triggerAutomationExecution(automationId: string, memberId: string): Promise<void> {
    this.log.info('Triggering automation execution!')

    const automation = await this.getAutomation(automationId)

    if (!automation) {
      this.log.warn('Automation not found!')
      return
    }

    const member = await this.getMember(memberId)

    if (!member) {
      this.log.warn('Member not found!')
      return
    }

    let executeMethod: (
      tenantId: string,
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
      executeMethod(member.tenantId, automation, member.id, member)
    } catch (err) {
      this.log.error(err, 'Error while executing automation!')
      // TODO store execution error
      throw err
    }
  }

  private async executeWebhook(
    tenantId: string,
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
  }

  private async executeSlack(
    tenantId: string,
    automation: IRelevantAutomationData,
    eventId: string,
    payload: unknown,
  ): Promise<void> {}

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

  private async getMember(memberId: string): Promise<IMemberData | null> {
    const cached = await this.memberCache.get(memberId)
    if (!cached) {
      const member = await this.memberRepo.get(memberId)
      if (!member) {
        return null
      }

      return member
    }

    return JSON.parse(cached)
  }
}
