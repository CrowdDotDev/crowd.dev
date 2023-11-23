import { getServiceLogger } from '@crowd/logging'
import cors from 'cors'
import express from 'express'
import { databaseMiddleware } from './middleware/database'
import { errorMiddleware } from './middleware/error'
import { loggingMiddleware } from './middleware/logging'
import { InitService, OpenSearchService } from '@crowd/opensearch'
import memberRoutes from './routes/member'
import activityRoutes from './routes/activity'
import organizationRoutes from './routes/organization'
import { getDbConnection } from '@crowd/database'
import { opensearchMiddleware } from 'middleware/opensearch'
import { getRedisClient } from '@crowd/redis'
import { redisMiddleware } from 'middleware/redis'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SEARCH_SYNC_API_CONFIG } from './conf'
import { ApiRequest } from 'middleware'

const log = getServiceLogger()
const config = SEARCH_SYNC_API_CONFIG()

setImmediate(async () => {
  const app = express()
  const redis = await getRedisClient(REDIS_CONFIG(), true)
  const opensearch = new OpenSearchService(log, OPENSEARCH_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG(), 20, 5000)

  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true, limit: '5mb' }))
  app.use(loggingMiddleware(log))
  app.use(redisMiddleware(redis))
  app.use(databaseMiddleware(dbConnection))
  app.use(opensearchMiddleware(opensearch))

  // init opensearch service
  const initService = new InitService(opensearch, log)
  await initService.initialize()

  // add routes
  app.use(memberRoutes)
  app.use(activityRoutes)
  app.use(organizationRoutes)

  app.use('/health', async (req: ApiRequest, res) => {
    res.status(200).send('Health check passed.')
  })

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Search Sync API listening on port ${config.port}!`)
  })
})
