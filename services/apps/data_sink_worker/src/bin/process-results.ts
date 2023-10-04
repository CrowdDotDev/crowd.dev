import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { APP_IOC_MODULE } from 'ioc'
import { APP_IOC } from 'ioc_constants'
import { SENTIMENT_CONFIG } from '../conf'
import DataSinkRepository from '../repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: resultIds')
    process.exit(1)
  }

  const resultIds = processArguments[0].split(',')

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const service = ioc.get<DataSinkService>(APP_IOC.dataSinkService)

  const repo = new DataSinkRepository(store, log)
  for (const resultId of resultIds) {
    const result = await repo.getResultInfo(resultId)
    if (!result) {
      log.error(`Result ${resultId} not found!`)
      continue
    } else {
      await repo.resetResults([resultId])

      await service.processResult(resultId)
    }
  }

  process.exit(0)
})
