import data from './data.json';

export default (inject) => () => {
  let resetUrl;
  before(() => {
    cy.mailosaurGetMessage(inject.serverId, {
      sentTo: inject.email,
    }).then((email) => {
      resetUrl = email.text.links[0].href;
      cy.visit(resetUrl);
      cy.wait(1000);
      cy.url().should('include', '/auth/password-reset');
    });
  });

  beforeEach(() => {
    cy.get('#password').as('password');
    cy.get('#passwordConfirmation').as(
      'passwordConfirmation',
    );
    cy.get('#submit').as('submit');
  });

  it('Does not submit if password is empty', () => {
    cy.get('@password').clear();
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if password confirmation is empty', () => {
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation').clear();

    cy.get('@submit').click();

    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if passwords do not match', () => {
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.wrong.password);

    cy.get('@submit').click();

    cy.get('form')
      .contains('Passwords do not match')
      .should('exist');
  });

  it('Does reset password if all fields are valid', () => {
    cy.server();
    cy.route('PUT', '/api/auth/password-reset').as('apiAuthPasswordReset');
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.wait('@apiAuthPasswordReset');

    cy.url().should('include', '/auth/password-reset');
    cy.contains(
      'You have successfuly reset your password',
    ).should('exist');
  });

  it('Goes back to signin', () => {
    cy.get('#continueSignIn').click();

    cy.url().should('include', '/auth/signin');
  });
};
