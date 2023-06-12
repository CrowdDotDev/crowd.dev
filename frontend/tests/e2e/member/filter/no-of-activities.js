export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('# of activities').click();
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

  it('has apply button disabled if negative value', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(-3);
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('fetches members with exactly 3 activities', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(3);

    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('eq', 3);
      });
    });
  });

  it('fetches members with exactly 3 activities - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(3);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('not.eq', 3);
      });
    });
  });

  it('fetches members with less than 3 activities', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('be.lt', 3);
      });
    });
  });

  it('fetches members with less than 3 activities - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('not.be.lt', 3);
      });
    });
  });

  it('fetches members with less than or equal 3 activities', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<=').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('be.lte', 3);
      });
    });
  });

  it('fetches members with less than or equal 3 activities - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('<=').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('not.be.lte', 3);
      });
    });
  });

  it('fetches members with more than 3 activities', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('be.gt', 3);
      });
    });
  });

  it('fetches members with more than 3 activities - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('not.be.gt', 3);
      });
    });
  });

  it('fetches members with more than or equal 3 activities', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>=').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('be.gte', 3);
      });
    });
  });

  it('fetches members with more than or equal 3 activities - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>=').click();
    cy.get('[data-qa="filter-include-switch"]').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('not.be.gte', 3);
      });
    });
  });

  it('has apply button disabled if range end value is empty', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('between').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(2);
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('fetches members with activity count between 2 and 6', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(2);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(6);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();

    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount).should('be.gte', 2);
        cy.wrap(+row.activityCount).should('be.lte', 6);
      });
    });
  });

  it('fetches members with activity count between 2 and 6 - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(2);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(6);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();

    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount < 2 || +row.activityCount > 6).should('be.eq', true);
      });
    });
  });

  it('has apply button disabled if range is invalid', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(22);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(6);
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });
};
