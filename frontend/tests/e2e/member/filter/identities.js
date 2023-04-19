export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Identities').click();
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

  it('has apply button disabled if no identity selected', () => {
    cy.get('.filter-type-select + div button.btn--primary').should('be.disabled');
  });

  it('Filters by each identity', () => {
    cy.get('.filter-type-select .filter-type-select-option').each((option) => {
      const platform = option.text().trim();
      const platformId = platform.replaceAll(' ', '').toLowerCase();
      cy.get('.filter-type-select .filter-type-select-option').contains(platform).click();
      cy.get('.filter-type-select + div button.btn--primary').click();
      cy.wait('@apiMemberQuery');
      cy.get('@apiMemberQuery').then((req) => {
        const { rows } = req.response.body;
        rows.forEach((row) => {
          cy.wrap(row.identities.some((ap) => ap.includes(platformId))).should('eq', true);
        });
        if (rows.length > 0) {
          cy.get('.identities').each((identities) => {
            cy.wrap(identities).find(`img[alt="${platform}"]`).should('exist');
          });
        }
      });
      cy.scrollTo(0, 0);
      cy.wait(300);
      cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
      cy.get('.filter-list .filter-list-item:first-child button:first-child').click({ force: true });
      cy.get('.filter-type-select .filter-type-select-option').contains(platform).click();
    });
  });
};
