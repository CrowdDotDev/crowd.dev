export default () => {
  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('# of open source contributions').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
  });

  it('has apply button disabled if empty field', () => {
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });

  it('has apply button disabled if negative value', () => {
    cy.get('.filter-type-number input[type="number"]').type('{selectall}').type(-3);
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });

  it('fetches members with exactly 3 activities', () => {
    cy.get('.filter-type-number input[type="number"]').type('{selectall}').type(3);

    cy.get('.filter-type-number + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        console.log(row);
        cy.wrap(+row.numberOfOpenSourceContributions).should('eq', 3);
      });
    });
  });

  it('fetches members with less than 3 activities', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('<').click();

    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.lt', 3);
      });
    });
  });

  it('fetches members with less than or equal 3 activities', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('<=').click();

    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.lte', 3);
      });
    });
  });

  it('fetches members with more than 3 activities', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('>').click();

    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.gt', 3);
      });
    });
  });

  it('fetches members with more than or equal 3 activities', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('>=').click();

    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.gte', 3);
      });
    });
  });

  it('has apply button disabled if range end value is empty', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('between').click();
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(2);
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });

  it('fetches members with activity count between 2 and 6', () => {
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(2);
    cy.get('.filter-type-number input[type="number"]').eq(1).type('{selectall}').type(6);
    cy.get('.filter-type-number + div button.btn--primary').as('filterApply').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.gte', 2);
        cy.wrap(+row.numberOfOpenSourceContributions).should('be.lte', 6);
      });
    });
  });

  it('has apply button disabled if range is invalid', () => {
    cy.get('.filter-list .filter-list-item:first-child button:first-child').click();
    cy.get('.filter-type-number input[type="number"]').eq(0).type('{selectall}').type(22);
    cy.get('.filter-type-number input[type="number"]').eq(1).type('{selectall}').type(6);
    cy.get('.filter-type-number + div button.btn--primary').should('be.disabled');
  });
};
