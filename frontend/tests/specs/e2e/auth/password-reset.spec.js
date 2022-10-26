const resetPasswordEndpoint =
  Cypress.env('apiUrl') + '/auth/password-reset'

describe('Reset password tests', function () {
  beforeEach(function () {
    cy.visit('/auth/password-reset')
    cy.intercept(resetPasswordEndpoint).as('resetPassword')
    cy.window().its('app.$store').as('store')
    cy.window().its('app.$router').as('router')
  })

  it("Fails to reset password because token doesn't exist", function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#password').type('password')
    cy.get('#passwordConfirmation').type('password')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_START'
    )

    cy.wait('@resetPassword')
      .its('request.body')
      .should((reqBody) => {
        expect(reqBody).to.not.have.property('token')
        expect(reqBody.password).to.be.eq('password')
      })

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_ERROR'
    )

    cy.get('.el-notification__content').contains(
      'Password reset link is invalid or has expired'
    )
    cy.url().should('contain', '/auth/signin')
  })

  it('Successfully resets password', function () {
    this.router.push('/auth/password-reset?token=1234')

    cy.spy(this.store, 'commit').as('commit')

    cy.get('#password').type('password')
    cy.get('#passwordConfirmation').type('password')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_START'
    )

    cy.wait('@resetPassword')
      .its('request.body')
      .should((reqBody) => {
        expect(reqBody.token).to.be.eq('1234')
        expect(reqBody.password).to.be.eq('password')
      })

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_SUCCESS'
    )
  })
})
