import { IServiceOptions } from './IServiceOptions'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import { LoggingBase } from './loggingBase'
import { EagleEyeContent, EagleEyeAction } from '../types/eagleEyeTypes'
import { PageData, QueryData } from '../types/common'
import Error400 from '../errors/Error400'

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

  /**  
  TODO
  */
  /* eslint-disable-next-line */
  async search(args) {
    return null
  }
}
