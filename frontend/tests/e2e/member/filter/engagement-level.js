export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Engagement level').click();
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

  it('has apply button disabled if no engagement level selected', () => {
    cy.get('.filter-type-select + div button.btn--primary').should('be.disabled');
  });

  it('Filters by each engagement level', () => {
    cy.get('.filter-type-select .filter-type-select-option').each((option) => {
      const engagementLevel = option.text().trim();
      cy.get('.filter-type-select .filter-type-select-option').contains(engagementLevel).click();
      cy.get('.filter-type-select + div button.btn--primary').click();
      cy.wait('@apiMemberQuery');
      cy.get('body').then(($body) => {
        if ($body.find('.member-engagement-level-label').length > 0) {
          cy.get('.member-engagement-level-label').each((engagement) => {
            cy.wrap(engagement.text()).should('eq', engagementLevel);
          });
        }
      })


      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
      cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
      cy.get('.filter-type-select .filter-type-select-option').contains(engagementLevel).click();
    });
  });
};
