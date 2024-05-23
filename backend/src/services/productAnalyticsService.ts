import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import ProductAnalyticsRepository from '@/database/repositories/productAnalyticsRepository'

export default class ProductAnalyticsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  public async createSession(data) {
    return ProductAnalyticsRepository.createSession(data, this.options)
  }

  public async updateSession(id, data) {
    return ProductAnalyticsRepository.updateSession(id, data, this.options)
  }

  public async createEvent(data) {
    return ProductAnalyticsRepository.createEvent(data, this.options)
  }
}
