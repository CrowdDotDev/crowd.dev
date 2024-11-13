import cors from 'cors'
import express from 'express'

import {
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { telemetryExpressMiddleware } from '@crowd/telemetry'

import { QueueFactory } from '../../../libs/queue/src'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG, WEBHOOK_API_CONFIG } from './conf'
import { databaseMiddleware } from './middleware/database'
import { emittersMiddleware } from './middleware/emitters'
import { errorMiddleware } from './middleware/error'
import { loggingMiddleware } from './middleware/logging'
import { queueMiddleware } from './middleware/queue'
import { installDataIssueRoutes } from './routes/dataIssue'
import { installDiscourseRoutes } from './routes/discourse'
import { installGitlabRoutes } from './routes/gitlab'
import { installGroupsIoRoutes } from './routes/groupsio'

const log = getServiceLogger()
const config = WEBHOOK_API_CONFIG()

setImmediate(async () => {
  const app = express()

  const redisClient = await getRedisClient(REDIS_CONFIG())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), 3, 0)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const integrationStreamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    queueClient,
    redisClient,
    loader,
    log,
  )

  await integrationStreamWorkerEmitter.init()
  app.use(emittersMiddleware(integrationStreamWorkerEmitter))
  app.use((req, res, next) => {
    // Groups.io doesn't send a content-type header,
    // so request body parsing is just skipped
    // But we fix it
    if (!req.headers['content-type']) {
      req.headers['content-type'] = 'application/json'
    }
    next()
  })

  app.use('/health', async (req, res) => {
    try {
      const dbPingRes = await dbConnection
        .result('select 1')
        .then((result) => result.rowCount === 1)

      if (dbPingRes) {
        res.sendStatus(200)
      } else {
        res.status(500).json({
          database: dbPingRes,
        })
      }
    } catch (err) {
      res.status(500).json({ error: err })
    }
  })

  app.use(telemetryExpressMiddleware('webhook.request.duration'))
  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true, limit: '5mb' }))
  app.use(loggingMiddleware(log))
  app.use(databaseMiddleware(dbConnection))
  app.use(queueMiddleware(queueClient))

  // add routes
  installGroupsIoRoutes(app)
  installDiscourseRoutes(app)
  installGitlabRoutes(app)
  installDataIssueRoutes(app)

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Webhook API listening on port ${config.port}!`)
  })
})
