import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import bunyanMiddleware from 'bunyan-middleware'
import * as http from 'http'
import { databaseMiddleware, errorMiddleware } from './middleware'
import { getServiceLogger } from '@crowd/logging'

const serviceLogger = getServiceLogger()

const app = express()

const server = http.createServer(app)

setImmediate(async () => {
  // Enables CORS
  app.use(cors({ origin: true }))

  // Logging middleware
  app.use(
    bunyanMiddleware({
      headerName: 'x-request-id',
      propertyName: 'requestId',
      logName: `requestId`,
      logger: serviceLogger,
      level: 'trace',
    }),
  )

  // Initializes and adds the database middleware.
  app.use(databaseMiddleware)

  app.use(helmet())

  app.use(
    bodyParser.json({
      verify(req, res, buf) {
        const url = (<any>req).originalUrl
        if (url.startsWith('/webhooks/stripe') || url.startsWith('/webhooks/sendgrid')) {
          // Stripe and sendgrid webhooks needs the body raw
          // for verifying the webhook with signing secret
          ;(<any>req).rawBody = buf.toString()
        }
      },
    }),
  )

  app.use(bodyParser.urlencoded({ extended: true }))

  const webhookRoutes = express.Router()
  require('./webhooks').default(webhookRoutes)
  app.use('/webhooks', webhookRoutes)

  const io = require('@pm2/io')

  app.use(errorMiddleware)

  app.use(io.expressErrorHandler())
})

export default server
