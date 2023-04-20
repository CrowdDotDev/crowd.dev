import filters from './filters';

export default () => {
  it('Redirects to member page', () => {
    cy.wait(130000);
    cy.get('#menu-members').click();
    cy.wait(500);
    cy.url().should('include', '/members');
  });

  describe(
    '[Member] Filters',
    filters,
  );
};
