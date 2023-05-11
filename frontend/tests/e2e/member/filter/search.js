export default () => {
  beforeEach(() => {
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
    cy.get('[data-qa="filter-search"]').as('searchInput');
  });

  let total = 0;

  it('Fetches member count', () => {
    cy.get('[data-qa="members-total"]').then((span) => {
      const [number] = span.text().trim().split(' ');
      total = +number;
    });
  });

  it('Searches for query "man"', () => {
    const query = 'man';

    cy.get('@searchInput').clear().type(query);
    cy.wait('@apiMemberQuery');

    cy.get('[data-qa="members-name"]').each((el) => {
      cy.wrap(el.text().toLowerCase()).should('contain', query);
    });
  });

  it('Searches for query "ch"', () => {
    const query = 'ch';
    cy.get('@searchInput').clear().type(query);
    cy.wait('@apiMemberQuery');

    cy.get('[data-qa="members-name"]').each((el) => {
      cy.wrap(el.text().toLowerCase()).should('contain', query);
    });
  });

  it('Displays all members if search query is empty', () => {
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');

    cy.get('@searchInput').clear();
    cy.wait('@apiMemberQuery');

    cy.get('[data-qa="members-total"]').then((span) => {
      const [number] = span.text().trim().split(' ');
      cy.wrap(+number).should('eq', total);
    });
  });
};
