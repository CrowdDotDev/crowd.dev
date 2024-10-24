import { convert as convertHtmlToText } from 'html-to-text'

import { distinct, getCleanString, processPaginated } from '@crowd/common'
import {
  IQueryActivityResult,
  doesConversationWithSlugExists,
  getActivitiesById,
  getConversationById,
  insertConversation,
  queryActivities,
  queryConversations,
  setConversationToActivity,
  updateConversation,
} from '@crowd/data-access-layer'
import { DbConnOrTx, DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'

import { IDbConversation } from '../repo/conversation.data'
import { ConversationRepository } from '../repo/conversation.repo'

export class ConversationService extends LoggerBase {
  constructor(
    private readonly pgStore: DbStore,
    private readonly qdbStore: DbConnOrTx,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  private async getConversation(
    tenantId: string,
    segmentId: string,
    id: string,
  ): Promise<IDbConversation> {
    const conversation = await getConversationById(this.qdbStore, id, tenantId, [segmentId])

    if (!conversation) {
      throw new Error(`Conversation ${id} does not exist!`)
    }

    return conversation
  }

  public async generateTitle(
    tenantId: string,
    segmentId: string,
    title: string,
    isHtml = false,
  ): Promise<string> {
    if (!title && getCleanString(title).length === 0) {
      const results = await queryConversations(this.qdbStore, {
        tenantId,
        segmentIds: [segmentId],
        countOnly: true,
      })

      return `conversation-${results.count}`
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
  public async generateSlug(tenantId: string, segmentId: string, title: string): Promise<string> {
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
    let slugExists = await doesConversationWithSlugExists(
      this.qdbStore,
      cleanedSlug,
      tenantId,
      segmentId,
    )

    // generated slug already exists in the tenant, start adding suffixes and re-check
    if (slugExists) {
      let suffix = 1

      const slugCopy = cleanedSlug

      while (slugExists) {
        const suffixedSlug = `${slugCopy}-${suffix}`
        slugExists = await doesConversationWithSlugExists(
          this.qdbStore,
          cleanedSlug,
          tenantId,
          segmentId,
        )
        suffix += 1
        cleanedSlug = suffixedSlug
      }
    }

    return cleanedSlug
  }

  // returns activity ids that were changed
  public async processActivity(
    tenantId: string,
    segmentId: string,
    activity: IQueryActivityResult,
  ): Promise<string[]> {
    if (!activity) {
      throw new Error('Activity must be set!')
    }

    this.log.debug({ activityId: activity.id }, 'Processing activity')

    let results: IQueryActivityResult[] = [activity]
    if (activity.parentId) {
      results = await getActivitiesById(this.qdbStore, [activity.parentId], tenantId, [segmentId])
      if (results.length !== 1) {
        throw new Error(`Parent activity ${activity.parentId} does not exist!`)
      }

      const parent = results[0]
      return await this.addToConversation(tenantId, segmentId, activity, parent)
    } else {
      const ids: string[] = []
      await processPaginated(
        async (page) => {
          const results = await queryActivities(this.qdbStore, {
            filter: {
              and: [{ sourceParentId: { eq: activity.sourceId } }],
            },
            tenantId,
            segmentIds: [segmentId],
            limit: 10,
            offset: (page - 1) * 10,
          })

          return results.rows
        },
        async (activities) => {
          for (const child of activities) {
            const results = await this.addToConversation(tenantId, segmentId, child, activity)
            ids.push(...results)
          }
        },
      )

      return distinct(ids)
    }
  }

  public async addToConversation(
    tenantId: string,
    segmentId: string,
    child: IQueryActivityResult,
    parent: IQueryActivityResult,
  ): Promise<string[]> {
    this.log = getChildLogger('addToConversation', this.log, {
      activityId: child.id,
      parentActivityId: parent.id,
    })

    const affectedIds: string[] = []

    const qdbConn = this.qdbStore

    await this.pgStore.transactionally(async (txStore) => {
      const txRepo = new ConversationRepository(txStore, this.log)

      let conversation: IDbConversation | null | undefined

      // check if parent is in a conversation already
      if (parent.conversationId) {
        conversation = await this.getConversation(tenantId, segmentId, parent.conversationId)
        // pg
        await txRepo.setActivityConversationId(tenantId, segmentId, child.id, parent.conversationId)
        // qdb
        await setConversationToActivity(
          qdbConn,
          parent.conversationId,
          child.id,
          tenantId,
          segmentId,
        )
        affectedIds.push(child.id)
      }
      // if child is already in a conversation
      else if (child.conversationId) {
        conversation = await this.getConversation(tenantId, segmentId, child.conversationId)

        if (!conversation.published) {
          const txService = new ConversationService(txStore, this.qdbStore, this.log)
          const newConversationTitle = await txService.generateTitle(
            tenantId,
            segmentId,
            parent.title || parent.body,
            ConversationService.hasHtmlActivities(parent.platform as PlatformType),
          )

          const newConversationSlug = await txService.generateSlug(
            tenantId,
            segmentId,
            newConversationTitle,
          )

          // pg
          await txRepo.setConversationTitleAndSlug(
            tenantId,
            segmentId,
            conversation.id,
            newConversationTitle,
            newConversationSlug,
          )

          // qdb
          await updateConversation(qdbConn, conversation.id, {
            title: newConversationTitle,
            slug: newConversationSlug,
            tenantId,
            segmentId,
          })
        }

        // pg
        await txRepo.setActivityConversationId(tenantId, segmentId, parent.id, conversation.id)
        // qdb
        await setConversationToActivity(qdbConn, conversation.id, parent.id, tenantId, segmentId)
        affectedIds.push(parent.id)
      } else {
        // create a new conversation
        const txService = new ConversationService(txStore, this.qdbStore, this.log)
        const conversationTitle = await txService.generateTitle(
          tenantId,
          segmentId,
          parent.title || parent.body,
          ConversationService.hasHtmlActivities(parent.platform as PlatformType),
        )
        const conversationSlug = await txService.generateSlug(
          tenantId,
          segmentId,
          conversationTitle,
        )

        // qdb
        const conversationId = await insertConversation(this.qdbStore, {
          tenantId,
          segmentId,
          activityParentId: parent.id,
          activityChildId: child.id,
          title: conversationTitle,
          published: false,
          slug: conversationSlug,
          timestamp: new Date(),
        })

        // pg
        await txRepo.createConversation(
          conversationId,
          tenantId,
          segmentId,
          conversationTitle,
          false,
          conversationSlug,
        )

        conversation = {
          id: conversationId,
          published: false,
        }

        await Promise.all([
          // pg
          txRepo.setActivityConversationId(tenantId, segmentId, parent.id, conversationId),
          txRepo.setActivityConversationId(tenantId, segmentId, child.id, conversationId),
          // qdb
          setConversationToActivity(qdbConn, conversationId, parent.id, tenantId, segmentId),
          setConversationToActivity(qdbConn, conversationId, child.id, tenantId, segmentId),
        ])
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
}
