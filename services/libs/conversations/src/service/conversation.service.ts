import { distinct, getCleanString, processPaginated } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'
import { convert as convertHtmlToText } from 'html-to-text'
import {
  IDbActivityInfo,
  IDbConversation,
  IDbConversationSettings,
} from '../repo/conversation.data'
import { ConversationRepository } from '../repo/conversation.repo'

export class ConversationService extends LoggerBase {
  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)
  }

  private async getConversation(
    tenantId: string,
    id: string,
    repo: ConversationRepository,
  ): Promise<IDbConversation> {
    const conversation = await repo.getConversation(tenantId, id)

    if (!conversation) {
      throw new Error(`Conversation ${id} does not exist!`)
    }

    return conversation
  }

  public async generateTitle(tenantId: string, title: string, isHtml = false): Promise<string> {
    if (!title && getCleanString(title).length === 0) {
      const repo = new ConversationRepository(this.store, this.log)
      const count = await repo.getConversationCount(tenantId)

      return `conversation-${count}`
    }

    if (isHtml) {
      // convert html to text
      const plainText = convertHtmlToText(title)
      // and remove new lines
      return plainText.replace(/\n/g, ' ')
    }

    return title
  }

  static readonly MAX_SLUG_WORD_LENGTH = 10
  public async generateSlug(tenantId: string, title: string): Promise<string> {
    // Remove non-standart characters and extra whitespaces
    const cleanedTitle = getCleanString(title)

    const slugArray = cleanedTitle.split(' ')
    let cleanedSlug = ''

    for (let i = 0; i < slugArray.length; i++) {
      if (i >= ConversationService.MAX_SLUG_WORD_LENGTH) {
        break
      }
      cleanedSlug += `${slugArray[i]}-`
    }

    // remove trailing dash
    cleanedSlug = cleanedSlug.replace(/-$/gi, '')

    // check generated slug already exists in tenant
    const repo = new ConversationRepository(this.store, this.log)

    let slugExists = await repo.checkSlugExists(tenantId, cleanedSlug)

    // generated slug already exists in the tenant, start adding suffixes and re-check
    if (slugExists) {
      let suffix = 1

      const slugCopy = cleanedSlug

      while (slugExists) {
        const suffixedSlug = `${slugCopy}-${suffix}`
        slugExists = await repo.checkSlugExists(tenantId, cleanedSlug)
        suffix += 1
        cleanedSlug = suffixedSlug
      }
    }

    return cleanedSlug
  }

  // returns activity ids that were changed
  public async processActivity(tenantId: string, activityId: string): Promise<string[]> {
    const repo = new ConversationRepository(this.store, this.log)

    const activity = await repo.getActivityData(tenantId, activityId)

    if (activity.parentId) {
      const parent = await repo.getActivityData(tenantId, activity.parentId)
      return await this.addToConversation(tenantId, activity, parent)
    } else {
      const ids: string[] = []
      await processPaginated(
        async (page) => {
          return repo.getActivities(tenantId, activity.sourceId, page, 10)
        },
        async (activities) => {
          for (const child of activities) {
            const results = await this.addToConversation(tenantId, child, activity)
            ids.push(...results)
          }
        },
      )

      return distinct(ids)
    }
  }

  public async addToConversation(
    tenantId: string,
    child: IDbActivityInfo,
    parent: IDbActivityInfo,
  ): Promise<string[]> {
    this.log = getChildLogger('addToConversation', this.log, {
      activityId: child.id,
      parentActivityId: parent.id,
    })

    const affectedIds: string[] = []

    await this.store.transactionally(async (txStore) => {
      const txRepo = new ConversationRepository(txStore, this.log)

      let conversation: IDbConversation | null | undefined

      // check if parent is in a conversation already
      if (parent.conversationId) {
        conversation = await this.getConversation(tenantId, parent.conversationId, txRepo)
        await txRepo.setActivityConversationId(tenantId, child.id, parent.conversationId)
        affectedIds.push(child.id)
      }
      // if child is already in a conversation
      else if (child.conversationId) {
        conversation = await this.getConversation(tenantId, child.conversationId, txRepo)

        if (!conversation.published) {
          const txService = new ConversationService(txStore, this.log)
          const newConversationTitle = await txService.generateTitle(
            tenantId,
            parent.title || parent.body,
            ConversationService.hasHtmlActivities(parent.platform as PlatformType),
          )

          const newConversationSlug = await txService.generateSlug(tenantId, newConversationTitle)

          await txRepo.setConversationTitleAndSlug(
            tenantId,
            conversation.id,
            newConversationTitle,
            newConversationSlug,
          )
        }

        await txRepo.setActivityConversationId(tenantId, parent.id, conversation.id)
        affectedIds.push(parent.id)
      } else {
        // create a new conversation
        const txService = new ConversationService(txStore, this.log)
        const conversationTitle = await txService.generateTitle(
          tenantId,
          parent.title || parent.body,
          ConversationService.hasHtmlActivities(parent.platform as PlatformType),
        )
        const conversationSlug = await txService.generateSlug(tenantId, conversationTitle)
        const conversationSettings = await txRepo.getConversationSettings(tenantId)
        const channel = ConversationService.getChannelFromActivity(
          parent.platform as PlatformType,
          parent.channel,
        )

        const published = ConversationService.shouldAutoPublishConversation(
          conversationSettings,
          parent.platform as PlatformType,
          channel,
        )

        const conversationId = await txRepo.createConversation(
          tenantId,
          conversationTitle,
          published,
          conversationSlug,
        )

        conversation = {
          id: conversationId,
          published,
        }

        await txRepo.setActivityConversationId(tenantId, parent.id, conversationId)
        await txRepo.setActivityConversationId(tenantId, child.id, conversationId)
        affectedIds.push(parent.id)
        affectedIds.push(child.id)
      }
    })

    return affectedIds
  }

  static hasHtmlActivities(platform: PlatformType): boolean {
    switch (platform) {
      case PlatformType.DEVTO:
        return true
      default:
        return false
    }
  }

  static getChannelFromActivity(platform: PlatformType, channel?: string): string | null {
    let result = null

    if (platform === PlatformType.DISCORD) {
      result = channel
    } else if (platform === PlatformType.SLACK) {
      result = channel
    } else if (platform === PlatformType.GITHUB) {
      const prefix = 'https://github.com/'
      if (channel.startsWith(prefix)) {
        result = channel.slice(prefix.length).split('/')[1]
      } else {
        result = channel.split('/')[1]
      }
    } else {
      result = channel
    }

    return result
  }

  static shouldAutoPublishConversation(
    conversationSettings: IDbConversationSettings,
    platform: PlatformType,
    channel: string | null,
  ) {
    let shouldAutoPublish = false

    if (!conversationSettings.autoPublish) {
      return shouldAutoPublish
    }

    if (conversationSettings.autoPublish.status === 'all') {
      shouldAutoPublish = true
    } else if (conversationSettings.autoPublish.status === 'custom') {
      shouldAutoPublish =
        conversationSettings.autoPublish.channelsByPlatform[platform] &&
        conversationSettings.autoPublish.channelsByPlatform[platform].includes(channel)
    }
    return shouldAutoPublish
  }
}
