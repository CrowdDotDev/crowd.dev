import axios from 'axios'
import { EAGLE_EYE_CONFIG } from '../config'
import { IServiceOptions } from './IServiceOptions'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import { LoggingBase } from './loggingBase'
import { EagleEyeContent, EagleEyeAction, EagleEyeSettings } from '../types/eagleEyeTypes'
import { PageData, QueryData } from '../types/common'
import Error400 from '../errors/Error400'
import UserRepository from '../database/repositories/userRepository'

export interface EagleEyeContentUpsertData extends EagleEyeAction {
  content: EagleEyeContent
}

export default class EagleEyeContentService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  /**
   * Create an eagle eye shown content record.
   * @param data Data to a new EagleEyeContent record.
   * @param options Repository options.
   * @returns Created EagleEyeContent record.
   */
  async upsert(data: EagleEyeContent): Promise<EagleEyeContent | null> {
    if (!data.url) {
      throw new Error400(this.options.language, 'errors.eagleEye.urlRequiredWhenUpserting')
    }

    // find by url
    const existing = await EagleEyeContentRepository.findByUrl(data.url, this.options)

    let record

    if (existing) {
      record = await EagleEyeContentRepository.update(existing.id, data, this.options)
    } else {
      record = await EagleEyeContentRepository.create(data, this.options)
    }

    return record
  }

  async findById(id: string): Promise<EagleEyeContent> {
    return EagleEyeContentRepository.findById(id, this.options)
  }

  async query(data: QueryData): Promise<PageData<EagleEyeContent>> {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return EagleEyeContentRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
      this.options,
    )
  }

  async search(email = false) {
    const eagleEyeSettings: EagleEyeSettings = (
      await UserRepository.findById(this.options.currentUser.id, this.options)
    ).eagleEyeSettings

    if (!eagleEyeSettings.onboarded) {
      throw new Error400(this.options.language, 'errors.eagleEye.notOnboarded')
    }

    const feedSettings = email ? eagleEyeSettings.emailDigest.feed : eagleEyeSettings.feed

    const keywords = feedSettings.keywords ? feedSettings.keywords.join(',') : ''
    const exactKeywords = feedSettings.exactKeywords ? feedSettings.exactKeywords.join(',') : ''
    const excludedKeywords = feedSettings.excludedKeywords
      ? feedSettings.excludedKeywords.join(',')
      : ''

    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${EAGLE_EYE_CONFIG.url}`,
      params: {
        platforms: feedSettings.platforms.join(','),
        keywords,
        exact_keywords: exactKeywords,
        exclude_keywords: excludedKeywords,
        after_date: feedSettings.publishedDate,
      },
      headers: {
        Authorization: `Bearer ${EAGLE_EYE_CONFIG.apiKey}`,
      },
    }

    const response = await axios(config)
    return response.data
  }
}
