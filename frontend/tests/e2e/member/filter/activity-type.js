export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Activity type').click();
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

  it('has apply button disabled if no activity type selected', () => {
    cy.get('.filter-type-select + div button.btn--primary').should('be.disabled');
  });

  it('Filters by each activity type', () => {
    cy.get('.filter-type-select .filter-type-select-option').each((option) => {
      const optionTypeText = option.text().trim();
      const optionTypeWords = optionTypeText.toLowerCase().split(' ').filter((word) => word.length > 1);
      cy.get('.filter-type-select .filter-type-select-option').contains(optionTypeText).click();
      cy.get('.filter-type-select + div button.btn--primary').click();
      cy.wait('@apiMemberQuery');
      cy.get('@apiMemberQuery').then((req) => {
        const { rows } = req.response.body;
        rows.forEach((row) => {
          const activity = row.activityTypes.some((type) => {
            const [, activityType] = type.split(':');
            const activityTypeWords = activityType.toLowerCase().split(/[-_]/).filter((word) => word.length > 1);
            return optionTypeWords.some((word) => activityTypeWords.some((aword) => word.includes(aword)));
          });
          cy.wrap(activity).should('eq', true);
        });
      });
      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
      cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
      cy.get('.filter-type-select .filter-type-select-option').contains(optionTypeText).click();
    });
  });
};
