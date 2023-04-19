export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Enriched member').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
  });

  after(() => {
    cy.scrollTo(0, 0);
    cy.get('.filter-list .filter-list-item:first-child button:last-child').click({ force: true });
  });

  it('has apply button disabled if no option selected', () => {
    cy.get('.filter-type-select + div button.btn--primary').should('be.disabled');
  });

  it('Filters by member enrichment True', () => {
    cy.get('.filter-type-select .filter-type-select-option').contains('True').click();
    cy.get('.filter-type-select + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(row.lastEnriched).should('not.eq', null);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
  });

  it('Filters by member enrichment False', () => {
    cy.get('.filter-type-select .filter-type-select-option').contains('False').click();
    cy.get('.filter-type-select + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(row.lastEnriched).should('eq', null);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
  });
};
