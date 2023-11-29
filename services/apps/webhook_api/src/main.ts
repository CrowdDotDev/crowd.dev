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
import { installGroupsIoRoutes } from './routes/groupsio'
import { installDiscourseRoutes } from './routes/discourse'
import cors from 'cors'
import { telemetryExpressMiddleware } from '@crowd/telemetry'

const log = getServiceLogger()
const config = WEBHOOK_API_CONFIG()

setImmediate(async () => {
  const app = express()

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), 3, 0)

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
  app.use(sqsMiddleware(sqsClient))

  // add routes
  installGithubRoutes(app)
  installGroupsIoRoutes(app)
  installDiscourseRoutes(app)

  app.use(errorMiddleware())

  app.listen(config.port, () => {
    log.info(`Webhook API listening on port ${config.port}!`)
  })
})
