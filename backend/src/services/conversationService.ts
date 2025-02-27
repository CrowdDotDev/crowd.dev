import emoji from 'emoji-dictionary'
import { convert as convertHtmlToText } from 'html-to-text'
import fetch from 'node-fetch'

import { Error403, distinct, getCleanString, single, singleOrDefault } from '@crowd/common'
import {
  DEFAULT_COLUMNS_TO_SELECT,
  IQueryActivityResult,
  deleteConversations,
  insertConversation,
  queryActivities,
  queryConversations,
  queryMembersAdvanced,
} from '@crowd/data-access-layer'
import { optionsQx } from '@crowd/data-access-layer/src/queryExecutor'
import { ActivityDisplayService } from '@crowd/integrations'
import { LoggerBase } from '@crowd/logging'
import { PageData, PlatformType } from '@crowd/types'

import OrganizationRepository from '@/database/repositories/organizationRepository'
import SegmentRepository from '@/database/repositories/segmentRepository'

import { S3_CONFIG } from '../conf/index'
import ConversationRepository from '../database/repositories/conversationRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import telemetryTrack from '../segment/telemetryTrack'

import { IServiceOptions } from './IServiceOptions'
import { s3 } from './aws'
import getStage from './helpers/getStage'
import IntegrationService from './integrationService'

export default class ConversationService extends LoggerBase {
  static readonly MAX_SLUG_WORD_LENGTH = 10

  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await ConversationRepository.create(data, {
        ...this.options,
        transaction,
      })

      const currentSegment = SequelizeRepository.getStrictlySingleActiveSegment(this.options)
      const currentUser = SequelizeRepository.getCurrentUser(this.options)

      await insertConversation(this.options.qdb, {
        id: record.id,
        segmentId: currentSegment.id,
        title: data.title,
        published: data.published,
        slug: data.slug,
        timestamp: new Date(Date.now()),
        createdById: currentUser.id,
        updatedById: currentUser.id,
      })

      telemetryTrack(
        'Conversation created',
        {
          id: record.id,
          createdAt: record.createdAt,
          platform: data.platform || 'unknown',
        },
        this.options,
      )

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'conversation')

      throw error
    }
  }

  /**
   * Clean a channel of non-unicode characters and remove front and trailing dashes
   * @param channel Channel to clean
   * @returns Cleaned channel
   */
  static sanitizeChannel(channel) {
    const hasAlha = channel.replace(/[^a-z0-9]/gi, '') !== ''

    if (!hasAlha && /\p{Emoji}/u.test(channel)) {
      return [...channel]
        .filter((char) => /\p{Emoji}/u.test(char))
        .map((unicodeEmoji) => emoji.getName(unicodeEmoji))
        .join('-')
      // return emoji.getName(rawChannel) || 'no-channel'
    }

    return (
      channel
        .split('-')
        .map((word) => word.replace(/[^a-z0-9]/gi, ''))
        .filter((word) => word !== '' && word !== undefined)
        .join('-') || 'no-channel'
    )
  }

  static getChannelFromActivity(activity) {
    let channel = null

    if (activity.platform === PlatformType.DISCORD) {
      channel = activity.channel
    } else if (activity.platform === PlatformType.SLACK) {
      channel = activity.channel
    } else if (activity.platform === PlatformType.GITHUB) {
      const prefix = 'https://github.com/'
      if (activity.channel.startsWith(prefix)) {
        channel = activity.channel.slice(prefix.length).split('/')[1]
      } else {
        channel = activity.channel.split('/')[1]
      }
    } else {
      channel = activity.channel
    }

    return channel
  }

  /**
   * Downloads slack attachments and saves them to an S3 bucket
   * @param activities activities to download attachments for
   * @returns The same activities, but the attachment URL is replaced with a public S3 bucket URL
   */
  async downloadSlackAttachments(activities) {
    const integrationService = new IntegrationService(this.options)
    const token = (await integrationService.findByPlatform(PlatformType.SLACK)).token
    const headers = {
      Authorization: `Bearer ${token}`,
    }
    return Promise.all(
      activities.map(async (act) => {
        if (act.attributes.attachments && act.attributes.attachments.length > 0) {
          act.attributes.attachments = await Promise.all(
            act.attributes.attachments.map(async (attachment) => {
              if (attachment.mediaType === 'image/png') {
                // Get the file URL from the attachment ID
                const axios = require('axios')
                const configForUrl = {
                  method: 'get',
                  url: `https://slack.com/api/files.info?file=${attachment.id}`,
                  headers,
                }

                const response = await axios(configForUrl)
                const data = response.data

                if ((data.error && data.needed === 'files:read') || !data.ok) {
                  throw new Error403('en', 'errors.missingScopes.message', {
                    integration: 'Slack',
                    scopes: 'files:read',
                  })
                }

                this.log.info(
                  `trying to get bucket ${S3_CONFIG.integrationsAssetsBucket}-${getStage()}`,
                )

                const url = data.file.url_private

                // Get the image from the URL
                return fetch(url, {
                  method: 'POST',
                  headers,
                }).then(async (res) => {
                  const objectParams = {
                    Bucket: `${S3_CONFIG.integrationsAssetsBucket}-${getStage()}`,
                    ContentType: 'image/png',
                    Body: res.body,
                    Key: `slack/${attachment.id}.png`,
                  }
                  // Upload the image to S3
                  const data = await s3.upload(objectParams).promise()
                  attachment.url = data.Location.replace(
                    'http://localstack',
                    'https://localhost.localstack.cloud',
                  )
                  return attachment
                })
              }
              return attachment
            }),
          )
          return act
        }
        return act
      }),
    )
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const record = await ConversationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'conversation')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await deleteConversations(this.options.qdb, ids)
      for (const id of ids) {
        await ConversationRepository.destroy(id, {
          ...this.options,
          transaction,
        })
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return ConversationRepository.findById(id, this.options)
  }

  async findAndCountAll(data) {
    const filter = data.filter
    const orderBy = Array.isArray(data.orderBy) ? data.orderBy : [data.orderBy]
    const limit = data.limit
    const offset = data.offset
    const countOnly = data.countOnly ?? false

    const segmentIds = SequelizeRepository.getSegmentIds(this.options)

    const page = await queryConversations(this.options.qdb, {
      segmentIds,
      filter,
      orderBy,
      limit,
      offset,
      countOnly,
    })

    const conversationIds = page.rows.map((r) => r.id)
    const activities = await queryActivities(this.options.qdb, {
      filter: {
        and: [{ conversationId: { in: conversationIds } }],
      },
      segmentIds,
      noLimit: true,
    })
    const memberIds = distinct(activities.rows.map((a) => a.memberId))
    const organizationIds = distinct(
      activities.rows.filter((a) => a.organizationId).map((a) => a.organizationId),
    )

    const promises = []
    if (memberIds.length > 0) {
      promises.push(
        queryMembersAdvanced(optionsQx(this.options), this.options.redis, {
          filter: {
            and: [{ id: { in: memberIds } }],
          },
          limit: memberIds.length,
        }).then((members) => {
          for (const row of activities.rows) {
            ;(row as any).member = singleOrDefault(members.rows, (m) => m.id === row.memberId)
            if (row.objectMemberId) {
              ;(row as any).objectMember = singleOrDefault(
                members.rows,
                (m) => m.id === row.objectMemberId,
              )
            }
          }
        }),
      )
    }

    if (organizationIds.length > 0) {
      promises.push(
        OrganizationRepository.findAndCountAll(
          {
            filter: {
              and: [{ id: { in: organizationIds } }],
            },
            limit: organizationIds.length,
          },
          this.options,
        ).then((organizations) => {
          for (const row of activities.rows.filter((r) => r.organizationId)) {
            ;(row as any).organization = singleOrDefault(
              organizations.rows,
              (o) => o.id === row.organizationId,
            )
          }
        }),
      )
    }

    await Promise.all(promises)

    for (const conversation of page.rows as any[]) {
      // find the first one
      const firstActivity = single(
        activities.rows,
        (a) => a.conversationId === conversation.id && a.parentId === null,
      )

      const remainingActivities = activities.rows
        .filter((a) => a.conversationId === conversation.id && a.parentId !== null)
        .sort(
          (a, b) =>
            // from oldest to newest
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )

      conversation.activities = [firstActivity, ...remainingActivities]
      for (const activity of conversation.activities) {
        activity.display = ActivityDisplayService.getDisplayOptions(
          activity,
          SegmentRepository.getActivityTypes(this.options),
        )
      }

      conversation.conversationStarter = conversation.activities[0] ?? null

      if (conversation.platform && conversation.platform === PlatformType.GITHUB) {
        conversation.channel = ConversationRepository.extractGitHubRepoPath(conversation.channel)
      }
    }

    return page
  }

  async count(filter: any) {
    const segmentIds = SequelizeRepository.getSegmentIds(this.options)

    const results = await queryConversations(this.options.qdb, {
      segmentIds,
      filter,
      countOnly: true,
    })

    return results.count
  }

  async query(data) {
    const filter = data.filter
    const orderBy = Array.isArray(data.orderBy) ? data.orderBy : [data.orderBy]
    const limit = data.limit
    const offset = data.offset
    const countOnly = data.countOnly ?? false

    const segmentIds = SequelizeRepository.getSegmentIds(this.options)

    const results = await queryConversations(this.options.qdb, {
      segmentIds,
      filter,
      orderBy,
      limit,
      offset,
      countOnly,
    })

    if (results.count === 0 || results.rows.length === 0) {
      return results
    }

    // Filter activities to have happened in the last month. If the activities
    // worker failed to create a conversation for activities, this gives a buffer
    // of a month to search for activities.
    const since = new Date(results.rows[results.rows.length - 1].createdAt)
    since.setMonth(since.getMonth() - 1)

    const conversationIds = results.rows.map((r) => r.id)
    const activities = (await queryActivities(
      this.options.qdb,
      {
        filter: {
          and: [
            {
              conversationId: {
                in: conversationIds,
              },
            },
            {
              timestamp: {
                gte: since,
              },
            },
          ],
        },
        segmentIds,
        noLimit: true,
      },
      DEFAULT_COLUMNS_TO_SELECT,
    )) as PageData<IQueryActivityResult>

    const memberIds = distinct(activities.rows.map((a) => a.memberId))
    if (memberIds.length > 0) {
      const memberResults = await queryMembersAdvanced(
        optionsQx(this.options),
        this.options.redis,
        { filter: { and: [{ id: { in: memberIds } }] }, limit: memberIds.length },
      )

      for (const activity of activities.rows) {
        ;(activity as any).member = singleOrDefault(
          memberResults.rows,
          (m) => m.id === activity.memberId,
        )
      }
    }

    for (const activity of activities.rows) {
      ;(activity as any).display = ActivityDisplayService.getDisplayOptions(
        activity,
        SegmentRepository.getActivityTypes(this.options),
      )
    }

    for (const conversation of results.rows) {
      const data = conversation as any

      const firstActivity = single(
        activities.rows,
        (a) => a.conversationId === conversation.id && a.parentId === null,
      )

      const remainingActivities = activities.rows
        .filter((a) => a.conversationId === conversation.id && a.parentId !== null)
        .sort(
          (a, b) =>
            // from oldest to newest
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )

      data.activities = [firstActivity, ...remainingActivities]
      data.conversationStarter = data.activities[0] ?? null
      data.lastReplies = data.activities.slice(1)
    }

    return results
  }

  /**
   * Generates a clean title from given string
   * @param title string used to generate a cleaned title
   * @param isHtml whether the title param is html or plain text
   * @returns cleaned title
   */
  async generateTitle(title: string, isHtml: boolean = false): Promise<string> {
    if (!title || getCleanString(title) === '') {
      const segmentIds = SequelizeRepository.getSegmentIds(this.options)

      const results = await queryConversations(this.options.qdb, {
        segmentIds,
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

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await ConversationRepository.destroyBulk(
        ids,
        {
          ...this.options,
          transaction,
        },
        true,
      )

      await deleteConversations(this.options.qdb, ids)
      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Generates a slug-like string from given title
   * If generated slug already exists for a tenant,
   * adds dashed suffixes until it finds a unique slug
   * @param title title used to generate slug-like string
   * @returns slug-like string
   *
   */
  async generateSlug(title: string): Promise<string> {
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
    let checkSlugCount = await this.count({ and: [{ slug: cleanedSlug }] })

    // generated slug already exists in the tenant, start adding suffixes and re-check
    if (checkSlugCount > 0) {
      let suffix = 1

      const slugCopy = cleanedSlug

      while (checkSlugCount > 0) {
        const suffixedSlug = `${slugCopy}-${suffix}`
        checkSlugCount = await this.count({ and: [{ slug: suffixedSlug }] })
        suffix += 1
        cleanedSlug = suffixedSlug
      }
    }

    return cleanedSlug
  }
}
