import { getServiceLogger } from '@crowd/logging'
import cors from 'cors'
import { telemetryExpressMiddleware } from '@crowd/telemetry'
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
  const dbConnection = await getDbConnection(DB_CONFIG(), 5, 5000)

  app.use(telemetryExpressMiddleware('search_sync_api.request.duration'))
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
    try {
      const [opensearchCheck, redisCheck, dbCheck] = await Promise.all([
        // ping opensearch
        opensearch.client.ping().then((res) => res.body),
        // ping redis,
        redis.ping().then((res) => res === 'PONG'),
        // ping database
        req.dbStore
          .connection()
          .any('select 1')
          .then((rows) => rows.length === 1),
      ])

      if (opensearchCheck && redisCheck && dbCheck) {
        res.sendStatus(200)
      } else {
        res.status(500).json({
          opensearch: opensearchCheck,
          redis: redisCheck,
          database: dbCheck,
        })
      }
    } catch (err) {
      res.status(500).json({ error: err })
    }
  })

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Search Sync API listening on port ${config.port}!`)
  })
})
