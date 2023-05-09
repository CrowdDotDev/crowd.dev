export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('Engagement level').click();
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

  it('has apply button disabled if no engagement level selected', () => {
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('Filters by each engagement level', () => {
    cy.get('[data-qa="filter-select-option"]').each((option) => {
      const engagementLevel = option.text().trim();
      cy.get('[data-qa="filter-select-option"]').contains(engagementLevel).click();
      cy.get('[data-qa="filter-apply"]').click();
      cy.wait('@apiMemberQuery');
      cy.get('body').then(($body) => {
        if ($body.find('[data-qa="member-engagement-level-label"]').length > 0) {
          cy.get('[data-qa="member-engagement-level-label"]').each((engagement) => {
            cy.wrap(engagement.text()).should('eq', engagementLevel);
          });
        }
      });

      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('[data-qa="filter-list-chip"]').click({ force: true });
      cy.get('[data-qa="filter-list-chip"]').click({ force: true });
      cy.get('[data-qa="filter-select-option"]').contains(engagementLevel).click();
    });
  });

  // TODO: uncomment when bug is fixed
  // it('Filters by each engagement level - exclude', () => {
  //   cy.get('[data-qa="filter-include-switch"]').click();
  //   cy.get('[data-qa="filter-select-option"]').each((option) => {
  //     const engagementLevel = option.text().trim();
  //     cy.get('[data-qa="filter-select-option"]').contains(engagementLevel).click();
  //     cy.get('[data-qa="filter-apply"]').click();
  //     cy.wait('@apiMemberQuery');
  //     cy.get('body').then(($body) => {
  //       if ($body.find('[data-qa="member-engagement-level-label"]').length > 0) {
  //         cy.get('[data-qa="member-engagement-level-label"]').each((engagement) => {
  //           cy.wrap(engagement.text()).should('not.eq', engagementLevel);
  //         });
  //       }
  //     });
  //
  //     cy.scrollTo(0, 0);
  //     cy.wait(300);
  //     cy.get('[data-qa="filter-list-chip"]').click({ force: true });
  //     cy.get('[data-qa="filter-list-chip"]').click({ force: true });
  //     cy.get('[data-qa="filter-select-option"]').contains(engagementLevel).click();
  //   });
  // });
};
