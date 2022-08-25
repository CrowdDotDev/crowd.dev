const forgotPasswordEndpoint =
  Cypress.env('apiUrl') + '/auth/send-password-reset-email'

describe('Forgot password tests', function () {
  beforeEach(function () {
    cy.visit('/auth/forgot-password')
    cy.intercept(forgotPasswordEndpoint).as(
      'forgotPassword'
    )
    cy.window().its('app.$store').as('store')
  })

  it("Fails to get reset password link because email doesn't exist", function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#email').type('unknown.email@email.com')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_EMAIL_START'
    )

    cy.wait('@forgotPassword')
      .its('request.body.email')
      .should('be.eq', 'unknown.email@email.com')

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_EMAIL_ERROR'
    )

    cy.get('.el-notification__content').contains(
      'Email not recognized'
    )
    cy.url().should('contain', '/auth/forgot-password')
  })

  it('Successfully gets reset password link through email', function () {
    cy.spy(this.store, 'commit').as('commit')

    cy.get('#email').type('john.doe@email.com')
    cy.get('#submit').click()

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_EMAIL_START'
    )

    cy.wait('@forgotPassword')
      .its('request.body.email')
      .should('be.eq', 'john.doe@email.com')

    cy.get('@commit').should(
      'have.been.calledWith',
      'auth/PASSWORD_RESET_EMAIL_SUCCESS'
    )

    cy.get('.el-notification__content').contains(
      'Password reset email successfully sent'
    )
  })
})
