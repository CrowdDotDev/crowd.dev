import data from './data.json';

export default (inject) => () => {
  before(() => {
    cy.visit(`${Cypress.env('appUrl')}/auth/signup`);
    cy.url().should('include', '/auth/signup');
  });

  beforeEach(() => {
    cy.get('#firstName').as('firstName');
    cy.get('#lastName').as('lastName');
    cy.get('#email').as('email');
    cy.get('#password').as('password');
    cy.get('#passwordConfirmation').as(
      'passwordConfirmation',
    );
    cy.get('#submit').as('submit');
  });

  it('Does not sign up if email already exist', () => {
    cy.server();
    cy.route('POST', '/api/auth/sign-up').as('apiSignup');

    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear().type(inject.email);
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.wait('@apiSignup');

    cy.url().should('include', '/auth/signup');
    cy.url().should('not.include', '/auth/email-unverified');
    cy.get('.el-notification__group').should(
      'contain.text',
      'This email is already taken',
    );
  });
};
