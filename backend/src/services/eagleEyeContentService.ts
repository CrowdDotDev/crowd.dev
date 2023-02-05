import { IServiceOptions } from './IServiceOptions'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import { LoggingBase } from './loggingBase'
import { EagleEyeContent, EagleEyeAction } from '../types/eagleEyeTypes'
import { PageData, QueryData } from '../types/common'
import SequelizeRepository from '../database/repositories/sequelizeRepository'

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

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {

      if (!data.url) {
        throw new Error(`Can't upsert without url`)
      }

      // find by url
      const existing = await EagleEyeContentRepository.findByUrl(data.url, this.options)

      let record

      if (existing) {
        record = await EagleEyeContentRepository.update(existing.id, data, this.options)
      } else {
        record = await EagleEyeContentRepository.create(data, this.options)
      }

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'EagleEyeContent')

      throw error
    }

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

  /** TODO 
  async search(args) {
  
  }
  */
}
