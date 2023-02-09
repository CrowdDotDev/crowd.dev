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

  /**
   * Validate and normalize feed settings.
   * @param data Feed data of type EagleEyeFeedSettings
   * @returns Normalized feed data if the input is valid. Otherwise a 400 Error
   */
  getFeed(data: EagleEyeFeedSettings) {
    // Feed is compulsory
    if (!data) {
      throw new Error400(this.options.language, 'errors.eagleEye.feedSettingsMissing')
    }

    // We need at least one of keywords or exactKeywords
    if (!data.keywords && !data.exactKeywords) {
      throw new Error400(this.options.language, 'errors.eagleEye.keywordsMissing')
    }

    // We need at least one platform
    if (!data.platforms || data.platforms.length === 0) {
      throw new Error400(this.options.language, 'errors.eagleEye.platformMissing')
    }

    // Make sure platforms are in the allowed list
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

    // We need a date. Make sure it's in the allowed list.
    const publishedDates = Object.values(EagleEyePublishedDates) as string[]
    if (publishedDates.indexOf(data.publishedDate) === -1) {
      throw new Error400(
        this.options.language,
        'errors.eagleEye.publishedDateMissing',
        publishedDates.join(', '),
      )
    }

    // Remove any extra fields
    return lodash.pick(data, [
      'keywords',
      'exactKeywords',
      'excludedKeywords',
      'publishedDate',
      'platforms',
    ])
  }

  /**
   * Validate and normalize email digest settings.
   * @param data Email digest settings of type EagleEyeEmailDigestSettings
   * @param feed Standard feed settings of type EagleEyeFeedSettings
   * @returns The normalized email digest settings if the input is valid. Otherwise a 400 Error.
   */
  getEmailDigestSettings(data: EagleEyeEmailDigestSettings, feed: EagleEyeFeedSettings) {
    // If the matchFeedSettings option is toggled, we set the email feed settings to the standard feed settings.
    // Otherwise, we validate and normalize the email feed settings.
    if (!data.matchFeedSettings) {
      data.feed = this.getFeed(data.feed)
    } else {
      data.feed = feed
    }

    // Make sure the email exists and is valid
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!emailRegex.test(data.email)) {
      throw new Error400(this.options.language, 'errors.eagleEye.emailInvalid')
    }

    // Make sure the frequency exists and is valid
    if (['daily', 'weekly'].indexOf(data.frequency) === -1) {
      throw new Error400(this.options.language, 'errors.eagleEye.frequencyInvalid')
    }

    // Make sure the time exists and is valid
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]?$/
    if (!timeRegex.test(data.time)) {
      throw new Error400(this.options.language, 'errors.eagleEye.timeInvalid')
    }

    // Remove any extra fields
    return lodash.pick(data, ['email', 'frequency', 'time', 'matchFeedSettings', 'feed'])
  }

  /**
   * Validate, normalize and update EagleEye settings.
   * @param data Input of type EagleEyeSettings
   * @returns Normalized EagleEyeSettings if the input is valid. Otherwise a 400 Error.
   */
  async update(data: EagleEyeSettings): Promise<EagleEyeSettings> {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    try {
      // At this point onboarded is true always
      data.onboarded = true

      // Validate and normalize feed settings
      data.feed = this.getFeed(data.feed)

      // If an email digest was sent, validate and normalize email digest settings
      // Otherwise, set email digest to false
      if (data.emailDigest || data.emailDigestActive) {
        data.emailDigestActive = true
        data.emailDigest = this.getEmailDigestSettings(data.emailDigest, data.feed)
      } else {
        data.emailDigestActive = false
      }

      // Remove any extra fields
      data = lodash.pick(data, ['onboarded', 'feed', 'emailDigestActive', 'emailDigest'])

      // Update the user's EagleEye settings
      const userOut = await UserRepository.updateEagleEyeSettings(
        this.options.currentUser.id,
        data,
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
