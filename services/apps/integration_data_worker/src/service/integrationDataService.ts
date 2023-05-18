import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import IntegrationDataRepository from '../repo/integrationData.repo'

export default class IntegrationDataService extends LoggerBase {
  private readonly repo: IntegrationDataRepository

  constructor(private readonly redisClient: RedisClient, store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.repo = new IntegrationDataRepository(store, this.log)
  }

  public async processData(dataId: string): Promise<void> {
    this.log.info({ dataId }, 'Trying to process stream data!')
  }
}
