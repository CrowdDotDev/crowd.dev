import express from 'express'
import cors from 'cors'
// import bodyParser from 'body-parser'
import helmet from 'helmet'
import { authMiddleware } from '../middlewares/authMiddleware'
import { tenantMiddleware } from '../middlewares/tenantMiddleware'
import { databaseMiddleware } from '../middlewares/databaseMiddleware'
import { searchEngineMiddleware } from '../middlewares/searchEngineMiddleware'
import { createRateLimiter } from './apiRateLimiter'
import { languageMiddleware } from '../middlewares/languageMiddleware'
import authSocial from './auth/authSocial'
import setupSwaggerUI from './apiDocumentation'
import { IS_CLOUD_ENV } from '../config'

const app = express()

// Enables CORS
app.use(cors({ origin: true }))

// Initializes and adds the database middleware.
app.use(databaseMiddleware)

// Initialize search engine
app.use(searchEngineMiddleware)

// Sets the current language of the request
app.use(languageMiddleware)

// Configures the authentication middleware
// to set the currentUser to the requests
app.use(authMiddleware)

// Setup the Documentation
setupSwaggerUI(app)

// Default rate limiter
const defaultRateLimiter = createRateLimiter({
  max: 500,
  windowMs: 15 * 60 * 1000,
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
require('./communityMember').default(routes)
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

// Loads the Tenant if the :tenantId param is passed
routes.param('tenantId', tenantMiddleware)

// Add the routes to the /api endpoint
if (IS_CLOUD_ENV) {
  app.use('/', routes)
} else {
  app.use('/api', routes)
}

const webhookRoutes = express.Router()
require('./webhooks').default(webhookRoutes)

app.use('/webhooks', webhookRoutes)

const io = require('@pm2/io')

app.use(io.expressErrorHandler())
export default app
