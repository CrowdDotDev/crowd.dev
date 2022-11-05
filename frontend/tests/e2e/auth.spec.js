import constants from '../constants.json'
import signup from './auth/signup'

Cypress.on('uncaught:exception', () => {
  return false
})

describe('AUTH', function () {
  before(() => {
    cy.visit(constants.url)
  })

  it('Redirects to signin page', () => {
    cy.url().should('include', '/auth/signin')
  })

  describe('[Auth] Signup', signup)
})
