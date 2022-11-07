import constants from '../../constants.json'
import data from './data.json'

export default (inject) => () => {
  before(() => {
    cy.visit(`${constants.url}/auth/signin`)
    cy.url().should('include', '/auth/signin')
  })

  beforeEach(() => {
    cy.get('#email').as('email')
    cy.get('#password').as('password')
    cy.get('#submit').as('submit')
  })

  it('Does not submit if email is empty', () => {
    cy.get('@email').clear()
    cy.get('@password').clear().type(data.password)

    cy.get('@submit').click()

    cy.url().should('not.include', '/onboard')
    cy.url().should('include', '/auth/signin')
    cy.get('form')
      .contains('This field is required')
      .should('exist')
  })

  it('Does not submit if email is invalid', () => {
    cy.get('@email').clear().type(data.firstName)
    cy.get('@password').clear().type(data.password)

    cy.get('@submit').click()

    cy.url().should('not.include', '/onboard')
    cy.url().should('include', '/auth/signin')
    cy.get('form')
      .contains('Please input correct email address')
      .should('exist')
  })

  it('Does not submit if password is empty', () => {
    cy.get('@email').clear().type(inject.email)
    cy.get('@password').clear()

    cy.get('@submit').click()

    cy.url().should('not.include', '/onboard')
    cy.url().should('include', '/auth/signin')
    cy.get('form')
      .contains('This field is required')
      .should('exist')
  })

  it('Does not signin if credentials are wrong', () => {
    cy.get('@email').clear().type(data.wrong.email)
    cy.get('@password').clear().type(data.wrong.password)

    cy.get('@submit').click()

    cy.url().should('not.include', '/onboard')
    cy.url().should('include', '/auth/signin')
    cy.get('.el-notification__content').should(
      'contain.text',
      'Sorry, this email does not match any record in our database'
    )
  })

  it('Signs in if all fields are valid', () => {
    cy.get('@email').clear().type(inject.email)
    cy.get('@password').clear().type(data.password)

    cy.get('@submit').click()

    cy.url().should('include', '/onboard')
    cy.url().should('not.include', '/auth/signin')
  })
}
