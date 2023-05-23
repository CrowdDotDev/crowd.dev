import { DbStore, getDbConnection } from '@crowd/database'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { DB_CONFIG, SENTIMENT_CONFIG } from './conf'
import DataSinkService from './service/dataSink.service'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

setImmediate(async () => {
  const dbConnection = getDbConnection(DB_CONFIG())

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const service = new DataSinkService(new DbStore(log, dbConnection), log)

  await service.processResult('4f81d320-f885-11ed-a781-02420a5a0007')
})
