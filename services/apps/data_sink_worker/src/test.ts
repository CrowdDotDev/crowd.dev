import { DbStore, getDbConnection } from '@crowd/database'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { DB_CONFIG, SENTIMENT_CONFIG } from './conf'
import DataSinkService from './service/dataSink.service'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationResultState } from '@crowd/types'

const log = getServiceLogger()

setImmediate(async () => {
  const dbConnection = getDbConnection(DB_CONFIG())

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const service = new DataSinkService(new DbStore(log, dbConnection), log)

  const id = '2abfed6a-f943-11ed-b2ff-02420a5a0007'
  await dbConnection.none(
    `update integration.results set state = '${IntegrationResultState.PENDING}' where id = $(id)`,
    {
      id,
    },
  )

  await service.processResult(id)
})
