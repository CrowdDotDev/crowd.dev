import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, SQS_CONFIG, WEBHOOK_API_CONFIG } from './conf'
import express from 'express'
import { loggingMiddleware } from './middleware/logging'
import { getSqsClient } from '@crowd/sqs'
import { getDbConnection } from '@crowd/database'
import { databaseMiddleware } from './middleware/database'
import { errorMiddleware } from './middleware/error'
import { sqsMiddleware } from './middleware/sqs'
import { installGithubRoutes } from './routes/github'

const log = getServiceLogger()
const config = WEBHOOK_API_CONFIG()

setImmediate(async () => {
  const app = express()

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), 3)

  app.use(express.json())
  app.use(loggingMiddleware(log))
  app.use(databaseMiddleware(dbConnection))
  app.use(sqsMiddleware(sqsClient))

  // add routes
  installGithubRoutes(app)

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Webhook API listening on port ${config.port}!`)
  })
})
