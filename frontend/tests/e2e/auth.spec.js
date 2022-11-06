import constants from '../constants.json'
import signup from './auth/signup'
import verifyEmail from './auth/verifyEmail'
import signin from './auth/signin'
import onboarding from './auth/onboarding'

Cypress.on('uncaught:exception', () => {
  return false
})

describe('AUTH', function () {
  const testEmailAddress = `test.${new Date().getTime()}@${Cypress.env(
    'MAILISK_NAMESPACE'
  )}.mailisk.net`

  before(() => {
    cy.visit(constants.url)
  })

  it('Redirects to signin page', () => {
    cy.url().should('include', '/auth/signin')
  })

  describe('[Auth] Signup', signup)
  describe('[Auth] Verify email', verifyEmail)
  //
  // describe('[Auth] Signin', signin)
  //
  // describe('[Onboarding]', onboarding)
})
