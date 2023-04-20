export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Reach').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
    cy.get('.filter-list .filter-list-item:first-child button:first-child').as('filterItem');
  });

  after(() => {
    cy.scrollTo(0, 0);
    cy.get('.filter-list .filter-list-item:first-child button:last-child').click({ force: true });
  });

  it('has apply button disabled if empty field', () => {
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });

  it('has apply button disabled if negative value', () => {
    cy.get('.filter-type-number input[type="number"]').type('{selectall}').type(-621);
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });

  it('fetches members with exactly 621 reach', () => {
    cy.get('.filter-type-number input[type="number"]').type('{selectall}').type(621);

    cy.get('.filter-type-number + div button.btn--primary').click();
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
    cy.get('.filter-type-number input[type="number"]').type('{selectall}').type(621);
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('<').click();
    cy.get('.filter-type-number .el-switch').click();

    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('<').click();
    cy.get('.filter-type-number .el-switch').click();

    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('<=').click();
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('<=').click();
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('>').click();
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('>').click();
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('>=').click();
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('>=').click();
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.reach.total).should('not.be.gte', 621);
      });
    });
  });

  it('has apply button disabled if range end value is empty', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('between').click();
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(200);
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });

  it('fetches members with activity count between 2 and 6', () => {
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(200);
    cy.get('.filter-type-number input[type="number"]').eq(1).type('{selectall}').type(1000);
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
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
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(200);
    cy.get('.filter-type-number input[type="number"]').eq(1).type('{selectall}').type(1000);
    cy.get('.filter-type-number .el-switch').click();
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.activityCount < 200 || +row.activityCount > 1000).should('be.eq', true);
      });
    });
  });

  it('has apply button disabled if range is invalid', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(1000);
    cy.get('.filter-type-number input[type="number"]').eq(1).type('{selectall}').type(200);
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });
};
