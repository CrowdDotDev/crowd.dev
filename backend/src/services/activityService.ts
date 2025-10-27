import { Blob } from 'buffer'
import vader from 'crowd-sentiment'

import { queryActivities } from '@crowd/data-access-layer'
import { LoggerBase, logExecutionTime } from '@crowd/logging'
import { IMemberIdentity, IntegrationResultType, PlatformType, SegmentData } from '@crowd/types'

import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { getDataSinkWorkerEmitter } from '@/serverless/utils/queueService'

import { GITHUB_CONFIG, IS_DEV_ENV, IS_TEST_ENV } from '../conf'
import ActivityRepository from '../database/repositories/activityRepository'
import SegmentRepository from '../database/repositories/segmentRepository'
import {
  UsernameIdentities,
  mapUsernameToIdentities,
} from '../database/repositories/types/memberTypes'

import { IServiceOptions } from './IServiceOptions'
import { detectSentiment, detectSentimentBatch } from './aws'
import SegmentService from './segmentService'

const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'

export default class ActivityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  /**
   * Get the sentiment of an activity from its body and title.
   * Only first 5000 bytes of text are passed through because of AWS Comprehend restrictions.
   * @param data Activity data. Includes body and title.
   * @returns The sentiment of the combination of body and title. Between -1 and 1.
   */
  async getSentiment(data) {
    if (IS_TEST_ENV) {
      return {
        positive: 0.42,
        negative: 0.42,
        neutral: 0.42,
        mixed: 0.42,
        label: 'positive',
        sentiment: 0.42,
      }
    }
    if (IS_DEV_ENV) {
      if (data.body === '' || data.body === undefined) {
        return {}
      }
      // Return a random number between 0 and 100
      const score = Math.floor(Math.random() * 100)
      let label = 'neutral'
      if (score < 33) {
        label = 'negative'
      } else if (score > 66) {
        label = 'positive'
      }
      return {
        positive: Math.floor(Math.random() * 100),
        negative: Math.floor(Math.random() * 100),
        neutral: Math.floor(Math.random() * 100),
        mixed: Math.floor(Math.random() * 100),
        sentiment: score,
        label,
      }
    }

    // When we implement Kern.ais's sentiment, we will get rid of this. In the meantime, we use Vader
    // because we don't have an agreement with LF for comprehend.
    if (IS_GITHUB_COMMIT_DATA_ENABLED) {
      const text = data.sourceParentId ? data.body : `${data.title} ${data.body}`
      const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text)
      const compound = Math.round(((sentiment.compound + 1) / 2) * 100)
      // Some activities are inherently different, we might want to dampen their sentiment

      let label = 'neutral'
      if (compound < 33) {
        label = 'negative'
      } else if (compound > 66) {
        label = 'positive'
      }

      return {
        positive: Math.round(sentiment.pos * 100),
        negative: Math.round(sentiment.neg * 100),
        neutral: Math.round(sentiment.neu * 100),
        mixed: Math.round(sentiment.neu * 100),
        sentiment: compound,
        label,
      }
    }

    try {
      data.body = data.body ?? ''
      data.title = data.title ?? ''

      // Concatenate title and body
      const text = `${data.title} ${data.body}`.trim()

      return text === '' ? {} : await detectSentiment(text)
    } catch (err) {
      this.log.error(
        { err, data },
        'Error getting sentiment of activity - Setting sentiment to empty object.',
      )
      return {}
    }
  }

  /**
   * Get the sentiment of an array of activities form its' body and title
   * Only first 5000 bytes of text are passed through because of AWS Comprehend restrictions.
   * @param activityArray activity array
   * @returns list of sentiments ordered same as input array
   */
  async getSentimentBatch(activityArray) {
    const ALLOWED_MAX_BYTE_LENGTH = 4500
    let textArray = await Promise.all(
      activityArray.map(async (i) => {
        let text = `${i.title} ${i.body}`.trim()
        let blob = new Blob([text])
        if (blob.size > ALLOWED_MAX_BYTE_LENGTH) {
          blob = blob.slice(0, ALLOWED_MAX_BYTE_LENGTH)
          text = await blob.text()
        }
        return text
      }),
    )

    const MAX_BATCH_SIZE = 25

    const promiseArray = []

    if (textArray.length > MAX_BATCH_SIZE) {
      while (textArray.length > MAX_BATCH_SIZE) {
        promiseArray.push(detectSentimentBatch(textArray.slice(0, MAX_BATCH_SIZE)))
        textArray = textArray.slice(MAX_BATCH_SIZE)
      }
      // insert last small chunk
      if (textArray.length > 0) promiseArray.push(detectSentimentBatch(textArray))
    } else {
      promiseArray.push(textArray)
    }

    const values = await logExecutionTime(
      () => Promise.all(promiseArray),
      this.log,
      'sentiment-api-request',
    )

    return values.reduce((acc, i) => {
      acc.push(...i)
      return acc
    }, [])
  }

  /**
   * Check if an activity exists. An activity is considered unique by sourceId & tenantId
   * @param data Data to be added to the database
   * @param transaction DB transaction
   * @returns The existing activity if it exists, false otherwise
   */
  async _activityExists(data, transaction) {
    const options: IRepositoryOptions = { ...this.options, transaction }
    // An activity is unique by it's sourceId and tenantId
    const exists = await ActivityRepository.findOne(
      {
        filter: {
          and: [{ sourceId: { eq: data.sourceId } }],
        },
      },
      options,
    )
    return exists || false
  }

  async createWithMember(data) {
    const logger = this.options.log
    const dataSinkWorkerEmitter = await getDataSinkWorkerEmitter()

    try {
      data.member.username = mapUsernameToIdentities(data.member.username, data.platform)

      if (!data.username) {
        data.username = data.member.username[data.platform][0].value
      }

      logger.trace(
        { type: data.type, platform: data.platform, username: data.username },
        'Processing activity with member!',
      )

      data.member.identities = ActivityService.processMemberIdentities(data.member, data.platform)

      // prepare objectMember for dataSinkWorker
      if (data.objectMember) {
        data.objectMember.username = mapUsernameToIdentities(
          data.objectMember.username,
          data.platform,
        )

        if (!data.objectMember.username[data.platform]) {
          throw new Error(`objectMember username for ${data.platform} is missing!`)
        }

        data.objectMemberUsername = data.objectMember.username[data.platform][0].value
        data.objectMember.identities = ActivityService.processMemberIdentities(
          data.objectMember,
          data.platform,
        )
      }

      if (data.member.organizations) {
        data.member.organizations.forEach((org) => {
          org.identities = [
            {
              name: org.name || org.website,
              platform: data.platform,
            },
          ]
        })
      }

      const resultId = await ActivityRepository.createResults(
        {
          type: IntegrationResultType.ACTIVITY,
          data,
        },
        this.options,
      )

      logger.trace(
        { type: data.type, platform: data.platform, username: data.username, processedData: data },
        'Sending activity with member to data-sink-worker!',
      )

      await dataSinkWorkerEmitter.triggerResultProcessing(resultId, resultId, true)
    } catch (error) {
      this.log.error(error, 'Error during activity create with member!')
      throw error
    }
  }

  async findById(id) {
    return ActivityRepository.findById(id, this.options)
  }

  async findActivityTypes(segments?: string[]) {
    const segmentService = new SegmentService(this.options)

    let subprojects: SegmentData[]

    if (!segments || segments.length === 0) {
      subprojects = await segmentService.getTenantSubprojects()
    } else {
      subprojects = await segmentService.getSegmentSubprojects(segments)
    }

    return SegmentService.getTenantActivityTypes(subprojects)
  }

  async findActivityChannels(segments?: string[]) {
    const segmentService = new SegmentService(this.options)

    let subprojects: SegmentData[]

    if (!segments || segments.length === 0) {
      subprojects = await segmentService.getTenantSubprojects()
    } else {
      subprojects = await segmentService.getSegmentSubprojects(segments)
    }

    return SegmentService.getTenantActivityChannels(
      subprojects.map((s) => s.id),
      this.options,
    )
  }

  async query(data) {
    const filter = data.filter
    const orderBy = Array.isArray(data.orderBy) ? data.orderBy : [data.orderBy]
    const limit = data.limit
    const offset = data.offset
    const countOnly = data.countOnly ?? false

    const segmentIds = SequelizeRepository.getSegmentIds(this.options)
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const activitiyTypes = SegmentRepository.getActivityTypes(this.options)

    const page = await queryActivities(
      {
        segmentIds,
        filter,
        orderBy,
        limit,
        offset,
        countOnly,
      },
      qx,
      activitiyTypes,
    )

    return page
  }

  static hasHtmlActivities(platform: PlatformType): boolean {
    switch (platform) {
      case PlatformType.DEVTO:
        return true
      default:
        return false
    }
  }

  static processMemberIdentities(
    member: {
      username: UsernameIdentities
      emails: string[]
    },
    platform: string,
  ): IMemberIdentity[] {
    const identities = []

    if (member.username) {
      Object.keys(member.username).forEach((platform) => {
        identities.push({
          platform,
          value: member.username[platform][0].value,
          type: member.username[platform][0].type,
          verified: true,
        })
      })
    }

    if (member.emails) {
      member.emails.forEach((email) => {
        identities.push({
          platform,
          value: email,
          type: 'email',
          verified: true,
        })
      })
    }

    return identities
  }
}
