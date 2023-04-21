export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Active On').click();
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

  it('has apply button disabled if no platform selected', () => {
    cy.get('.filter-type-select + div button.btn--primary').should('be.disabled');
  });

  it('Filters by each platform', () => {
    cy.get('.filter-type-select .filter-type-select-option').each((option) => {
      const platform = option.text().trim();
      const platformId = platform.replaceAll(' ', '').toLowerCase();
      cy.wrap(option).click();
      cy.get('.filter-type-select + div button.btn--primary').click();
      cy.wait('@apiMemberQuery');
      cy.get('@apiMemberQuery').then((req) => {
        const { rows } = req.response.body;
        rows.forEach((row) => {
          cy.wrap(row.activeOn.some((ap) => ap.includes(platformId))).should('eq', true);
        });
      });
      cy.wait(300);
      cy.get('.filter-list .filter-list-item-btn__open').eq(0).click();
      cy.wait(200);
      cy.wrap(option).click();
    });
  });

  it('Filters by each platform - exclude', () => {
    cy.get('.filter-list-item-popper .el-switch').click();
    cy.get('.filter-type-select .filter-type-select-option').each((option) => {
      const platform = option.text().trim();
      const platformId = platform.replaceAll(' ', '').toLowerCase();
      cy.wrap(option).click();
      cy.get('.filter-type-select + div button.btn--primary').click();
      cy.wait('@apiMemberQuery');
      cy.get('@apiMemberQuery').then((req) => {
        const { rows } = req.response.body;
        rows.forEach((row) => {
          cy.wrap(row.activeOn.some((ap) => ap.includes(platformId))).should('eq', false);
        });
      });
      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('.filter-list .filter-list-item-btn__open').eq(0).click({ force: true });
      cy.wrap(option).click();
    });
  });
};
