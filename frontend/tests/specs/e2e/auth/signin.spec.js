const signinEndpoint =
  Cypress.env('apiUrl') + '/auth/sign-in'

describe('Sign in tests', function () {
  beforeEach(() => {
    cy.visit('/auth/signin')
    cy.intercept(signinEndpoint).as('signin')
    cy.window().its('app.$store').as('store')
  })

  it('Fails to login due to bad credentials', function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#email').type('john.doe@email.com')
    cy.get('#password').type('password123')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_START'
    )

    cy.wait('@signin')
      .its('request.body')
      .should((reqBody) => {
        expect(reqBody.email).to.be.eq('john.doe@email.com')
        expect(reqBody.password).to.be.eq('password123')
      })

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_ERROR'
    )

    cy.get('.el-notification__content').contains(
      'Bad credentials'
    )

    cy.url().should('contain', '/auth/signin')
  })

  it('Successfully logs in', function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#email').type('john.doe@email.com')
    cy.get('#password').type('password')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_START'
    )

    cy.wait('@signin')
      .its('request.body')
      .should((reqBody) => {
        expect(reqBody.email).to.be.eq('john.doe@email.com')
        expect(reqBody.password).to.be.eq('password')
      })

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/AUTH_SUCCESS'
    )

    cy.url().should('contain', '/')
  })
})
