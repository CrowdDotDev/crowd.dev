const signupEndpoint =
  Cypress.env('apiUrl') + '/auth/sign-up'

describe('Sign up tests', function () {
  beforeEach(() => {
    cy.visit('/auth/signup')
    cy.intercept(signupEndpoint).as('signup')
    cy.window().its('app.$store').as('store')
  })

  it('Fails to create an account because email already exists', function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#firstName').type('John')
    cy.get('#lastName').type('Doe')
    cy.get('#email').type('john.doe@email.com')
    cy.get('#password').type('password')
    cy.get('#passwordConfirmation').type('password')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_START'
    )

    cy.wait('@signup')
      .its('request.body')
      .should((reqBody) => {
        expect(reqBody.email).to.be.eq('john.doe@email.com')
        expect(reqBody.password).to.be.eq('password')
      })

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_ERROR'
    )

    cy.get('.el-notification__content').contains(
      'Email is already in use'
    )
    cy.url().should('contain', '/auth/signup')
  })

  it('Successfully creates an account and tenant', function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#firstName').type('John')
    cy.get('#lastName').type('Doe')
    cy.get('#email').type('new.user@email.com')
    cy.get('#password').type('password')
    cy.get('#passwordConfirmation').type('password')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_START'
    )

    cy.wait('@signup')
      .its('request.body')
      .should((reqBody) => {
        expect(reqBody.email).to.be.eq('new.user@email.com')
        expect(reqBody.password).to.be.eq('password')
      })

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_SUCCESS'
    )

    cy.url().should('contain', '/onboard')
  })
})
