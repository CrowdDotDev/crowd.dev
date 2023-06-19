export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('Enriched member').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
    cy.get('[data-qa="filter-list-chip"]').as('filterItem');
  });

  after(() => {
    cy.scrollTo(0, 0);
    cy.get('[data-qa="filter-list-chip-close"]').click({ force: true });
  });

  it('Filters by member enrichment True', () => {
    cy.get('[data-qa="filter-boolean-true"]').click();
    cy.wait(100);
    cy.get('.filter-boolean [data-qa="filter-apply"]').click({ force: true });
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(row.lastEnriched).should('not.eq', null);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
  });

  it('Filters by member enrichment True - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.wait(100);
    cy.get('.filter-boolean [data-qa="filter-apply"]').click({ force: true });
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(row.lastEnriched).should('eq', null);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
  });

  it('Filters by member enrichment False', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-boolean-false"]').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('.filter-boolean [data-qa="filter-apply"]').click({ force: true });
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(row.lastEnriched).should('eq', null);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
  });

  it('Filters by member enrichment False - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-boolean-false"]').contains('False').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('.filter-boolean [data-qa="filter-apply"]').click({ force: true });
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(row.lastEnriched).should('not.eq', null);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
  });
};
