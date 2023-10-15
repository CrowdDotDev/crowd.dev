import { DATABASE_IOC } from '@crowd/database'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import cors from 'cors'
import express from 'express'
import { DbConnection } from './../../../libs/database/src/types'
import { SEARCH_SYNC_API_CONFIG } from './conf'
import { databaseMiddleware } from './middleware/database'
import { errorMiddleware } from './middleware/error'
import { loggingMiddleware } from './middleware/logging'
import { InitService } from '@crowd/opensearch'
import { IOC } from '@crowd/ioc'
import memberRoutes from './routes/member'
import activityRoutes from './routes/activity'
import organizationRoutes from './routes/organization'

const config = SEARCH_SYNC_API_CONFIG()

setImmediate(async () => {
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  const app = express()

  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true, limit: '5mb' }))
  app.use(loggingMiddleware(log))
  app.use(databaseMiddleware(ioc.get<DbConnection>(DATABASE_IOC.connection)))

  // init opensearch service
  const initService = ioc.get<InitService>(InitService)
  await initService.initialize()

  // add routes
  app.use(memberRoutes)
  app.use(activityRoutes)
  app.use(organizationRoutes)

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Search Sync API listening on port ${config.port}!`)
  })
})
