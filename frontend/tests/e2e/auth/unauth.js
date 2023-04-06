export default () => () => {
  it('Redirects to dashboard if authenticated', () => {
    cy.visit(`${Cypress.env('appUrl')}/auth/signin`);

    cy.wait(400);

    cy.url().should('not.include', '/auth/signin');
    cy.location('pathname').should('eq', '/');
  });
};
