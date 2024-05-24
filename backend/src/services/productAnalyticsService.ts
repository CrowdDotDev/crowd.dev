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
    try {
      return await ProductAnalyticsRepository.createSession(data, this.options)
    } catch (error) {
      throw new Error('Error during session create!')
    }
  }

  public async updateSession(id, data) {
    try {
      return await ProductAnalyticsRepository.updateSession(id, data, this.options)
    } catch (error) {
      throw new Error('Error during session update!')
    }
  }

  public async createEvent(data) {
    try {
      return await ProductAnalyticsRepository.createEvent(data, this.options)
    } catch (error) {
      throw new Error('Error during event create!')
    }
  }
}
