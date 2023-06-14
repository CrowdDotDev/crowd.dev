export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('Activity type').click();
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

  it('has apply button disabled if no activity type selected', () => {
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('Filters by each activity type', () => {
    cy.get('[data-qa="filter-select-option"]').each((option, index) => {
      if (index > 15) {
        return;
      }
      const optionValue = option.attr('data-qa-value');
      cy.wrap(option).click();
      cy.get('[data-qa="filter-apply"]').click();
      cy.wait('@apiMemberQuery');
      cy.get('@apiMemberQuery').then((req) => {
        const { rows } = req.response.body;
        rows.forEach((row) => {
          cy.wrap(row.activityTypes).should('include', optionValue);
        });
      });
      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('[data-qa="filter-list-chip"]').click({ force: true });
      cy.wrap(option).click();
    });
  });

  it('Filters by each activity type - exclude', () => {
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-select-option"]').each((option, index) => {
      if (index > 15) {
        return;
      }
      const optionValue = option.attr('data-qa-value');
      cy.wrap(option).click();
      cy.get('[data-qa="filter-apply"]').click();
      cy.wait('@apiMemberQuery');
      cy.get('@apiMemberQuery').then((req) => {
        const { rows } = req.response.body;
        rows.forEach((row) => {
          cy.wrap(row.activityTypes).should('not.include', optionValue);
        });
      });
      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('[data-qa="filter-list-chip"]').click({ force: true });
      cy.wrap(option).click();
    });
  });
};
