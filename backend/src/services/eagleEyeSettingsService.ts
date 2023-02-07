import moment from 'moment'
import lodash from 'lodash'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import UserRepository from '../database/repositories/userRepository'
import Error400 from '../errors/Error400'
import {
  EagleEyeSettings,
  EagleEyeFeedSettings,
  EagleEyePlatforms,
  EagleEyePublishedDates,
  EagleEyeEmailDigestSettings,
} from '../types/eagleEyeTypes'
import { IServiceOptions } from './IServiceOptions'
import { LoggingBase } from './loggingBase'

export default class EagleEyeSettingsService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  getFeed(data: EagleEyeFeedSettings) {
    if (!data) {
      throw new Error400(this.options.language, 'errors.eagleEye.feedSettingsMissing')
    }

    if (!data.keywords && !data.exactKeywords) {
      throw new Error400(this.options.language, 'errors.eagleEye.keywordsMissing')
    }

    if (!data.platforms || data.platforms.length === 0) {
      throw new Error400(this.options.language, 'errors.eagleEye.platformMissing')
    }

    const platforms = Object.values(EagleEyePlatforms) as string[]
    data.platforms.forEach((platform) => {
      if (!platforms.includes(platform)) {
        throw new Error400(
          this.options.language,
          'errors.eagleEye.platformInvalid',
          platform,
          platforms.join(', '),
        )
      }
    })

    const publishedDates = Object.values(EagleEyePublishedDates) as string[]
    if (publishedDates.indexOf(data.publishedDate as string) === -1) {
      throw new Error400(
        this.options.language,
        'errors.eagleEye.publishedDateMissing',
        publishedDates.join(', '),
      )
    }

    data.publishedDate = EagleEyeSettingsService.switchDate(data.publishedDate as string)
    return lodash.pick(data, [
      'keywords',
      'exactKeywords',
      'excludedKeywords',
      'publishedDate',
      'platforms',
    ])
  }

  static switchDate(date: string) {
    switch (date) {
      case 'Last 24h':
        return moment().subtract(1, 'days').format('YYYY-MM-DD')
      case 'Last 7 days':
        return moment().subtract(7, 'days').format('YYYY-MM-DD')
      case 'Last 14 days':
        return moment().subtract(14, 'days').format('YYYY-MM-DD')
      case 'Last 30 days':
        return moment().subtract(30, 'days').format('YYYY-MM-DD')
      case 'Last 90 days':
        return moment().subtract(90, 'days').format('YYYY-MM-DD')
      default:
        return null
    }
  }

  getEmailDigestSettings(data: EagleEyeEmailDigestSettings, feed: EagleEyeFeedSettings) {
    if (!data.matchFeedSettings) {
      data.feed = this.getFeed(data.feed)
    } else {
      data.feed = feed
    }

    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!emailRegex.test(data.email)) {
      throw new Error400(this.options.language, 'errors.eagleEye.emailInvalid')
    }

    if (['daily', 'weekly'].indexOf(data.frequency) === -1) {
      throw new Error400(this.options.language, 'errors.eagleEye.frequencyInvalid')
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]?$/
    if (!timeRegex.test(data.time)) {
      throw new Error400(this.options.language, 'errors.eagleEye.timeInvalid')
    }

    return lodash.pick(data, ['email', 'frequency', 'time', 'matchFeedSettings', 'feed'])
  }

  async update(data: EagleEyeSettings): Promise<EagleEyeSettings> {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    try {
      data.onboarded = true

      data.feed = this.getFeed(data.feed)

      if (data.emailDigest || data.emailDigestActive) {
        data.emailDigestActive = true

        data.emailDigest = this.getEmailDigestSettings(data.emailDigest, data.feed)
      } else {
        data.emailDigestActive = false
      }

      data = lodash.pick(data, ['onboarded', 'feed', 'emailDigestActive', 'emailDigest'])

      const userOut = await UserRepository.updateEagleEyeSettings(
        this.options.currentUser.id,
        { eagleEyeSettings: data },
        { ...this.options, transaction },
      )

      await SequelizeRepository.commitTransaction(transaction)

      return userOut.eagleEyeSettings
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'EagleEyeContent')

      throw error
    }
  }
}
