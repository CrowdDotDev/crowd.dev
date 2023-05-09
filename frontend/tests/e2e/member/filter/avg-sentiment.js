export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('Avg. sentiment').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
  });

  after(() => {
    cy.scrollTo(0, 0);
    cy.get('[data-qa="filter-list-chip-close"]').click({ force: true });
  });

  it('has apply button disabled if no sentiment selected', () => {
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('Filters by positive sentiment', () => {
    cy.get('[data-qa="filter-select-option"]').contains('Positive').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('be.gte', 67);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-select-option"]').contains('Positive').click();
  });

  it('Filters by positive sentiment - exclude', () => {
    cy.get('[data-qa="filter-select-option"]').contains('Positive').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('not.be.gte', 67);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-select-option"]').contains('Positive').click();
  });

  it('Filters by neutral sentiment', () => {
    cy.get('[data-qa="filter-select-option"]').contains('Neutral').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
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
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-select-option"]').contains('Neutral').click();
  });

  it('Filters by neutral sentiment - exclude', () => {
    cy.get('[data-qa="filter-select-option"]').contains('Neutral').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment < 33 || +row.averageSentiment > 67).should('be.eq', true);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-select-option"]').contains('Neutral').click();
  });

  it('Filters by negative sentiment', () => {
    cy.get('[data-qa="filter-select-option"]').contains('Negative').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('be.lt', 33);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-select-option"]').contains('Negative').click();
  });

  it('Filters by negative sentiment - exclude', () => {
    cy.get('[data-qa="filter-select-option"]').contains('Negative').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');
    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.averageSentiment).should('not.be.lt', 33);
      });
    });
    cy.scrollTo(0, 0);
    cy.wait(300);
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-list-chip"]').click({ force: true });
    cy.get('[data-qa="filter-select-option"]').contains('Negative').click();
  });
};
