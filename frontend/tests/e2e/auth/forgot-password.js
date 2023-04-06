import data from './data.json';

export default (injected) => () => {
  before(() => {
    cy.contains('Forgot password').click();
    cy.url().should('include', '/auth/forgot-password');
  });

  beforeEach(() => {
    cy.get('#email').as('email');
    cy.get('#submit').as('submit');
  });

  it('Does not submit if email is empty', () => {
    cy.get('@email').clear();

    cy.get('@submit').click();

    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if email is invalid', () => {
    cy.get('@email').clear().type(data.firstName);

    cy.get('@submit').click();

    cy.get('form')
      .contains('Please input correct email address')
      .should('exist');
  });

  it('Does send forgot password if all fields are valid', () => {
    cy.server();
    cy.route('POST', '/api/auth/send-password-reset-email').as('apiAuthSendPasswordResetEmail');
    cy.mailosaurDeleteAllMessages(injected.serverId);
    cy.get('@email').clear().type(injected.email);

    cy.get('@submit').click();

    cy.wait('@apiAuthSendPasswordResetEmail');

    cy.url().should('include', '/auth/forgot-password');
    cy.contains(injected.email).should('exist');
  });
};
