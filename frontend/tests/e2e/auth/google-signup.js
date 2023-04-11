import data from './data.json';

export default (inject) => () => {
  before(() => {
    cy.visit(`${Cypress.env('appUrl')}/auth/signup`);
    cy.url().should('include', '/auth/signup');
  });

  it('Signs up with google', () => {
    cy.get('#googleSignup').click();
    cy.origin('https://accounts.google.com/', () => {
      cy.get('input[type="email"]').clear().type('crowd.dev.tester@gmail.com');
      cy.get('[data-is-touch-wrapper] button[type="button"]').filter(':visible').first().click();

      cy.wait(3000);

      cy.get('input[type="password"]').clear().type('CrowdTesting2023!')
    });
  });
};
