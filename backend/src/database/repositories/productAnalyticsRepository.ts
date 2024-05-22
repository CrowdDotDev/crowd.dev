import { IRepositoryOptions } from './IRepositoryOptions'

export default class ProductAnalyticsRepository {
  static async create(data, options: IRepositoryOptions): Promise<void> {
    options.log.info('ProductAnalyticsRepository.create', data, options)
  }
}
