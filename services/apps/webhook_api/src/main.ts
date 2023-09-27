import { DATABASE_IOC } from '@crowd/database'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { SQS_IOC, SqsClient } from '@crowd/sqs'
import cors from 'cors'
import express from 'express'
import { DbConnection } from './../../../libs/database/src/types'
import { WEBHOOK_API_CONFIG } from './conf'
import { APP_IOC_MODULE } from './ioc'
import { databaseMiddleware } from './middleware/database'
import { errorMiddleware } from './middleware/error'
import { loggingMiddleware } from './middleware/logging'
import { sqsMiddleware } from './middleware/sqs'
import { installGithubRoutes } from './routes/github'
import { installGroupsIoRoutes } from './routes/groupsio'
import { IOC } from '@crowd/ioc'

const config = WEBHOOK_API_CONFIG()

setImmediate(async () => {
  await APP_IOC_MODULE(5)

  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  const app = express()

  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true, limit: '5mb' }))
  app.use(loggingMiddleware(log))
  app.use(databaseMiddleware(ioc.get<DbConnection>(DATABASE_IOC.connection)))
  app.use(sqsMiddleware(ioc.get<SqsClient>(SQS_IOC.client)))

  // add routes
  installGithubRoutes(app)
  installGroupsIoRoutes(app)

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Webhook API listening on port ${config.port}!`)
  })
})
