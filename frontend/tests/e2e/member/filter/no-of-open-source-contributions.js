export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('# of open source contributions').click();
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

  // TODO: Enable when bug fixed
  // it('has apply button disabled if negative value', () => {
  //   cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(-3);
  //   cy.get('[data-qa="filter-apply"]').should('be.disabled');
  // });

  it('fetches members with exactly 3 contributions', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(3);

    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('eq', 3);
      });
      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('eq', 3);
      });
    });
  });

  it('fetches members with exactly 3 contributions - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(3);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('not.eq', 3);
      });
      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('not.eq', 3);
      });
    });
  });

  it('fetches members with less than 3 contributions', () => {
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
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.lt', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('be.lt', 3);
      });
    });
  });

  it('fetches members with less than 3 contributions - exclude', () => {
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
        cy.wrap(+row.numberOfOpenSourceContributions).should('not.be.lt', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('not.be.lt', 3);
      });
    });
  });

  it('fetches members with less than or equal 3 contributions', () => {
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
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.lte', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('be.lte', 3);
      });
    });
  });

  it('fetches members with less than or equal 3 contributions - exclude', () => {
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
        cy.wrap(+row.numberOfOpenSourceContributions).should('not.be.lte', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('not.be.lte', 3);
      });
    });
  });

  it('fetches members with more than 3 contributions', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.gt', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('be.gt', 3);
      });
    });
  });

  it('fetches members with more than 3 contributions - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('>').click();

    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('not.be.gt', 3);
      });
      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('not.be.gt', 3);
      });
    });
  });

  it('fetches members with more than or equal 3 contributions', () => {
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
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.gte', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('be.gte', 3);
      });
    });
  });

  it('fetches members with more than or equal 3 contributions - exclude', () => {
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
        cy.wrap(+row.numberOfOpenSourceContributions).should('not.be.gte', 3);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('not.be.gte', 3);
      });
    });
  });

  it('has apply button disabled if range end value is empty', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('between').click();
    cy.get('[data-qa="filter-number-from"]').eq(0).type('{selectall}').type(2);
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('fetches members with contribution count between 2 and 6', () => {
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(2);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(6);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.gte', 2);
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.lte', 6);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text()).should('be.gte', 2);
        cy.wrap(+oss.text()).should('be.lte', 6);
      });
    });
  });

  it('fetches members with contribution count between 2 and 6 - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(2);
    cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(6);
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions < 2 || +row.numberOfOpenSourceContributions > 6).should('be.eq', true);
      });

      cy.get('[data-qa="member-oss-contributions"]').each((oss) => {
        cy.wrap(+oss.text() < 2 || +oss.text() > 6).should('be.eq', true);
      });
    });
  });

  // TODO: Enable when bug fixed
  // it('has apply button disabled if range is invalid', () => {
  //   cy.get('@filterItem').click();
  //   cy.wait(100);
  //   cy.get('@filterItem').click();
  //   cy.get('[data-qa="filter-number-from"]').type('{selectall}').type(22);
  //   cy.get('[data-qa="filter-number-to"]').type('{selectall}').type(6);
  //   cy.get('[data-qa="filter-apply"]').should('be.disabled');
  // });
};
