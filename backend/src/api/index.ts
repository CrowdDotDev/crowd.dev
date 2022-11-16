import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bunyanMiddleware from 'bunyan-middleware'
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
import { createRedisClient, RedisCache } from '../utils/redis'

const serviceLogger = createServiceLogger()

const app = express()

setImmediate(async () => {
  const client = await createRedisClient(true)
  await client.ping()

  const cache = new RedisCache('test', client)

  await cache.setValue('blabla', '123')
  const value = await cache.getValue('blabla')
  console.log(value)

  console.log(await cache.getValueByKeyPattern('bla*'))
  await cache.deleteByKeyPattern('bla*')

  console.log(await cache.getValue('blabla'))
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

// Parses the body of POST/PUT request
// to JSON
// app.use(
//  bodyParser.json({
//    verify (req, res, buf) {
//      const url = (<any>req).originalUrl
//      if (url.startsWith('/api/plan/stripe/webhook')) {
//        // Stripe Webhook needs the body raw in order
//        // to validate the request
//        (<any>req).rawBody = buf.toString()
//      }
//    },
//  }),
// )

app.use(express.json())

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

// Loads the Tenant if the :tenantId param is passed
routes.param('tenantId', tenantMiddleware)

app.use('/', routes)

const webhookRoutes = express.Router()
require('./webhooks').default(webhookRoutes)

app.use('/webhooks', webhookRoutes)

const io = require('@pm2/io')

app.use(errorMiddleware)

app.use(io.expressErrorHandler())

export default app
