export default () => {
  beforeEach(() => {
    cy.get('#accountDropdown').as('accountDropdown');
  });

  it('Logs out successfully', () => {
    cy.wait(500);

    cy.get('@accountDropdown').click();
    cy.wait(200);
    cy.get('#logout').as('logout');
    cy.get('@logout').click();

    cy.wait(500)

    cy.url().should('include', '/auth/signin');
  });
};
