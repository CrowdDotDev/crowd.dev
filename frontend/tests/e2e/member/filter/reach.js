export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('Reach').click();
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

  it('has apply button disabled if empty field', () => {
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  // TODO: uncomment when bug is fixed
  // it('has apply button disabled if negative value', () => {
  //   cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(-621);
  //   cy.get('[data-qa="filter-apply"]').should('be.disabled');
  // });

  it('fetches members with exactly 621 reach', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(621);

    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('eq', 621);
      });
    });
  });

  it('fetches members with exactly 621 reach - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(621);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('not.eq', 621);
      });
    });
  });

  it('fetches members with less than 621 reach', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('be.lt', 621);
      });
    });
  });

  it('fetches members with less than 621 reach - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('not.be.lt', 621);
      });
    });
  });

  it('fetches members with less than or equal 621 reach', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<=').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('be.lte', 621);
      });
    });
  });

  it('fetches members with less than or equal 621 reach - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<=').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('not.be.lte', 621);
      });
    });
  });

  it('fetches members with more than 621 reach', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('be.gt', 621);
      });
    });
  });

  it('fetches members with more than 621 reach - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('not.be.gt', 621);
      });
    });
  });

  it('fetches members with more than or equal 621 reach', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>=').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('be.gte', 621);
      });
    });
  });

  it('fetches members with more than or equal 621 reach - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>=').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('not.be.gte', 621);
      });
    });
  });

  it('has apply button disabled if range end value is empty', () => {
    cy.get('[data-qa="filter-list-chip"]').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('between').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(200);
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('fetches members with activity count between 2 and 6', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(200);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(1000);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('be.gte', 200);
        cy.wrap(+row.reach.total).should('be.lte', 1000);
      });
    });
  });

  it('fetches members with activity count between 2 and 6 - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(200);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(1000);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount < 200 || +row.activityCount > 1000).should('be.eq', true);
      });
    });
  });

  // TODO: uncomment when bug is fixed
  // it('has apply button disabled if range is invalid', () => {
  //   cy.get('[data-qa="filter-list-chip"]').click();
  //   cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(1000);
  //   cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(200);
  //   cy.get('[data-qa="filter-apply"]').should('be.disabled');
  // });
};
