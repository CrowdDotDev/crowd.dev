import constants from '../constants.json'
import signup from './auth/signup'
import verifyEmail from './auth/verifyEmail'
import signin from './auth/signin'
import onboarding from './auth/onboarding'
import logout from './auth/logout'
import forgotPassword from './auth/forgot-password'
import passwordReset from './auth/password-reset'

Cypress.on('uncaught:exception', () => {
  return false
})

describe('AUTH', function () {
  const serverId = Cypress.env('MAILOSAUR_SERVER_ID')
  const email = `${new Date().getTime()}@${serverId}.mailosaur.net`

  before(() => {
    cy.visit(constants.url)
  })

  beforeEach(() => {
    cy.restoreLocalStorage()
  })

  afterEach(() => {
    cy.saveLocalStorage()
  })

  it('Redirects to signin page', () => {
    cy.url().should('include', '/auth/signin')
  })

  describe(
    '[Auth] Signup',
    signup({
      email
    })
  )
  describe(
    '[Auth] Verify email',
    verifyEmail({
      email,
      serverId
    })
  )

  describe(
    '[Auth] Signin',
    signin({
      email
    })
  )

  describe('[Onboarding]', onboarding)

  describe('[Auth] Logout', logout)

  describe(
    '[Auth] Forgot password',
    forgotPassword({
      email,
      serverId
    })
  )
  describe(
    '[Auth] Password reset',
    passwordReset({
      email,
      serverId
    })
  )
})
