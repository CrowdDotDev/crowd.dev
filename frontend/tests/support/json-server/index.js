const path = require('path')
const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router(
  path.join(__dirname, 'db.json')
)
const middlewares = jsonServer.defaults()

const authModule = require('./auth/routes')

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares)

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser)

server.put('/auth/password-reset', authModule.passwordReset)
server.post(
  '/auth/send-email-address-verification-email',
  authModule.sendEmailAddressVerificationEmail
)
server.post(
  '/auth/send-password-reset-email',
  authModule.sendPasswordResetEmail
)
server.post('/auth/sign-in', authModule.signin)
server.post('/auth/sign-up', authModule.signup)
server.put('/auth/profile', authModule.profile)
server.put(
  '/auth/change-password',
  authModule.changePassword
)
server.put('/auth/verify-email', authModule.verifyEmail)
server.get('/auth/me', authModule.me)
server.get('/tenant/:tenantId/cubejs/auth', (req, res) => {
  res.send('cubejs token')
})
server.get('/tenant/:tenantId/integration', (req, res) => {
  res.send({
    rows: [],
    count: 0
  })
})

// To override the response format to match our API standards
router.render = (req, res) => {
  if (Array.isArray(res.locals.data)) {
    res.jsonp({
      rows: res.locals.data,
      count: res.locals.data.length
    })
  } else {
    res.jsonp(res.locals.data)
  }
}

server.use(router)
server.listen(3000, () => {
  console.log('JSON Server is running')
})
