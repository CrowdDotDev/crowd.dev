export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Avg. sentiment').click();
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

  it('has apply button disabled if no sentiment selected', () => {
    cy.get('.filter-type-select + div button.btn--primary').should('be.disabled');
  });

  it('Filters by positive sentiment', () => {
    cy.get('.filter-type-select .filter-type-select-option').contains('Positive').click();
    cy.get('.filter-type-select + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('be.gte', 67);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-type-select .filter-type-select-option').contains('Positive').click();
  });

  it('Filters by neutral sentiment', () => {
    cy.get('.filter-type-select .filter-type-select-option').contains('Neutral').click();
    cy.get('.filter-type-select + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('be.gte', 33);
        cy.wrap(+row.averageSentiment).should('be.lt', 67);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-type-select .filter-type-select-option').contains('Neutral').click();
  });

  it('Filters by negative sentiment', () => {
    cy.get('.filter-type-select .filter-type-select-option').contains('Negative').click();
    cy.get('.filter-type-select + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('be.lt', 33);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
    cy.get('.filter-type-select .filter-type-select-option').contains('Negative').click();
  });
};
