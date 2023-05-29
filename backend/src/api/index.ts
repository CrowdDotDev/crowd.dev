import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import bunyanMiddleware from 'bunyan-middleware'
import * as http from 'http'
import { Unleash } from 'unleash-client'
import { getRedisClient, getRedisPubSubPair, RedisPubSubReceiver } from '@crowd/redis'
import { API_CONFIG, REDIS_CONFIG, UNLEASH_CONFIG } from '../conf'
import { authMiddleware } from '../middlewares/authMiddleware'
import { tenantMiddleware } from '../middlewares/tenantMiddleware'
import { databaseMiddleware } from '../middlewares/databaseMiddleware'
import { searchEngineMiddleware } from '../middlewares/searchEngineMiddleware'
import { createRateLimiter } from './apiRateLimiter'
import { languageMiddleware } from '../middlewares/languageMiddleware'
import authSocial from './auth/authSocial'
import setupSwaggerUI from './apiDocumentation'
import { createServiceLogger } from '../utils/logging'
import { responseHandlerMiddleware } from '../middlewares/responseHandlerMiddleware'
import { errorMiddleware } from '../middlewares/errorMiddleware'
import { passportStrategyMiddleware } from '../middlewares/passportStrategyMiddleware'
import { redisMiddleware } from '../middlewares/redisMiddleware'
import WebSockets from './websockets'
import { ApiWebsocketMessage } from '../types/mq/apiWebsocketMessage'
import { Edition } from '../types/common'

const serviceLogger = createServiceLogger()

const app = express()

const server = http.createServer(app)

setImmediate(async () => {
  const redis = await getRedisClient(REDIS_CONFIG, true)

  const redisPubSubPair = await getRedisPubSubPair(REDIS_CONFIG)
  const userNamespace = await WebSockets.initialize(server)

  const pubSubReceiver = new RedisPubSubReceiver(
    'api-pubsub',
    redisPubSubPair.subClient,
    (err) => {
      serviceLogger.error(err, 'Error while listening to Redis Pub/Sub api-ws channel!')
      process.exit(1)
    },
    serviceLogger,
  )

  pubSubReceiver.subscribe('user', async (message) => {
    const data = message as ApiWebsocketMessage

    if (data.tenantId) {
      await userNamespace.emitForTenant(data.tenantId, data.event, data.data)
    } else if (data.userId) {
      userNamespace.emitToUserRoom(data.userId, data.event, data.data)
    } else {
      serviceLogger.error({ type: data.type }, 'Received invalid websocket message!')
    }
  })

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

  // Initialize search engine
  app.use(searchEngineMiddleware)

  // Bind redis to request
  app.use(redisMiddleware(redis))

  // Bind unleash to request
  if (UNLEASH_CONFIG.url && API_CONFIG.edition === Edition.CROWD_HOSTED) {
    const unleash = new Unleash({
      url: `${UNLEASH_CONFIG.url}/api`,
      appName: 'crowd-api',
      customHeaders: {
        Authorization: UNLEASH_CONFIG.backendApiKey,
      },
    })

    unleash.on('error', (err) => {
      serviceLogger.error(err, 'Unleash client error!')
    })

    let isReady = false

    setInterval(async () => {
      if (!isReady) {
        serviceLogger.error('Unleash client is not ready yet, exiting...')
        process.exit(1)
      }
    }, 60 * 1000)

    await new Promise<void>((resolve) => {
      unleash.on('ready', () => {
        serviceLogger.info('Unleash client is ready!')
        isReady = true
        resolve()
      })
    })

    app.use((req: any, res, next) => {
      req.unleash = unleash
      next()
    })
  }

  // initialize passport strategies
  app.use(passportStrategyMiddleware)

  // Sets the current language of the request
  app.use(languageMiddleware)

  // adds our ApiResponseHandler instance to the req object as responseHandler
  app.use(responseHandlerMiddleware)

  // Configures the authentication middleware
  // to set the currentUser to the requests
  app.use(authMiddleware)

  // Setup the Documentation
  setupSwaggerUI(app)

  // Default rate limiter
  const defaultRateLimiter = createRateLimiter({
    max: 200,
    windowMs: 60 * 1000,
    message: 'errors.429',
  })
  app.use(defaultRateLimiter)

  // Enables Helmet, a set of tools to
  // increase security.
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

  // Configure the Entity routes
  const routes = express.Router()

  // Enable Passport for Social Sign-in
  authSocial(app, routes)

  require('./auditLog').default(routes)
  require('./auth').default(routes)
  require('./plan').default(routes)
  require('./tenant').default(routes)
  require('./user').default(routes)
  require('./settings').default(routes)
  require('./member').default(routes)
  require('./widget').default(routes)
  require('./activity').default(routes)
  require('./tag').default(routes)
  require('./widget').default(routes)
  require('./cubejs').default(routes)
  require('./report').default(routes)
  require('./integration').default(routes)
  require('./microservice').default(routes)
  require('./conversation').default(routes)
  require('./eagleEyeContent').default(routes)
  require('./automation').default(routes)
  require('./task').default(routes)
  require('./note').default(routes)
  require('./organization').default(routes)
  require('./quickstart-guide').default(routes)
  require('./slack').default(routes)
  require('./eventTracking').default(routes)
  require('./premium/enrichment').default(routes)
  // Loads the Tenant if the :tenantId param is passed
  routes.param('tenantId', tenantMiddleware)

  app.use('/', routes)

  const webhookRoutes = express.Router()
  require('./webhooks').default(webhookRoutes)

  app.use('/webhooks', webhookRoutes)

  const io = require('@pm2/io')

  app.use(errorMiddleware)

  app.use(io.expressErrorHandler())
})

export default server
