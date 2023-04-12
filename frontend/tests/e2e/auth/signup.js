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

  it('Does not submit if First name is empty', () => {
    cy.get('@firstName').clear();
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear().type(inject.email);
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if Last name is empty', () => {
    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear();
    cy.get('@email').clear().type(inject.email);
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if email is empty', () => {
    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear();
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if email is invalid', () => {
    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear().type(data.firstName);
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('Please input correct email address')
      .should('exist');
  });

  it('Does not submit if password is empty', () => {
    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear().type(inject.email);
    cy.get('@password').clear();
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.password);

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if password confirmation is empty', () => {
    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear().type(inject.email);
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation').clear();

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('This field is required')
      .should('exist');
  });

  it('Does not submit if passwords dont match', () => {
    cy.get('@firstName').clear().type(data.firstName);
    cy.get('@lastName').clear().type(data.lastName);
    cy.get('@email').clear().type(inject.email);
    cy.get('@password').clear().type(data.password);
    cy.get('@passwordConfirmation')
      .clear()
      .type(data.wrong.password);

    cy.get('@submit').click();

    cy.url().should('not.include', '/onboard');
    cy.url().should('include', '/auth/signup');
    cy.get('form')
      .contains('Passwords do not match')
      .should('exist');
  });

  it('Signs up if all fields are valid', () => {
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

    cy.url().should('not.include', '/auth/signup');
    cy.url().should('include', '/auth/email-unverified');
  });
};
