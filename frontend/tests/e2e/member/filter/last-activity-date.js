import moment from 'moment';

export default () => {
  const oneWeekAgo = moment().subtract(7, 'day').format('YYYY-MM-DD');
  const twoDaysAgo = moment().subtract(2, 'day').format('YYYY-MM-DD');

  before(() => {
    cy.wait(1000);
    cy.get('.filter-dropdown button').click();
    cy.get('#filterList li').contains('Last activity date').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
    cy.get('.filter-list .filter-list-item:first-child button:first-child').as('filterItem');
    cy.wait(100);
  });

  after(() => {
    cy.scrollTo(0, 0);
    cy.get('.filter-list .filter-list-item:first-child button:last-child').click({ force: true });
  });

  it('has apply button disabled if empty field', () => {
    cy.get('.filter-with-operator-and-input + div button.btn--primary').should('be.disabled');
  });

  it('corrects date if invalid date entered', () => {
    cy.get('.filter-with-operator-and-input input[type="text"]').as('dateField');
    cy.get('@dateField').clear().type('500-01-2023').blur();
    cy.get('@dateField').should('have.value', '2023-01-01');
  });

  it('fetches users who joined 2 weeks ago', () => {
    cy.get('.filter-with-operator-and-input input[type="text"]').clear().type(oneWeekAgo).blur();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        console.log(row);
        cy.wrap(moment(row.lastActive).isSame(oneWeekAgo, 'day')).should('eq', true);
      });
    });
  });

  // TODO: uncomment when bug is fixed
  // it('fetches users who joined 2 weeks ago - exclude', () => {
  //   cy.get('@filterItem').click();
  //   cy.wait(100);
  //   cy.get('@filterItem').click();
  //   cy.get('.filter-with-operator-and-input input[type="text"]').clear().type(oneWeekAgo).blur();
  //   cy.get('.filter-with-operator-and-input .el-switch').click();
  //   cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
  //   cy.wait('@apiMemberQuery');
  //
  //   cy.get('@apiMemberQuery').then((req) => {
  //     const { rows } = req.response.body;
  //     rows.forEach((row) => {
  //       cy.wrap(moment(row.lastActive).isSame(oneWeekAgo, 'day')).should('eq', false);
  //     });
  //   });
  // });

  it('fetches users who joined before 2 weeks ago', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-with-operator-and-input input[type="text"]').clear().type(oneWeekAgo).blur();
    cy.get('.filter-with-operator-and-input .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('is before').click();
    // TODO: uncomment when bug is fixed
    // cy.get('.filter-with-operator-and-input .el-switch').click();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.lastActive).isBefore(moment(oneWeekAgo))).should('eq', true);
      });
    });
  });

  it('fetches users who joined before 2 weeks ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-with-operator-and-input input[type="text"]').clear().type(oneWeekAgo).blur();
    cy.get('.filter-with-operator-and-input .el-switch').click();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.lastActive).isBefore(moment(oneWeekAgo))).should('eq', false);
      });
    });
  });

  it('fetches users who joined after 2 weeks ago', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-with-operator-and-input input[type="text"]').clear().type(oneWeekAgo).blur();
    cy.get('.filter-with-operator-and-input .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('is after').click();
    cy.get('.filter-with-operator-and-input .el-switch').click();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.lastActive).isAfter(moment(oneWeekAgo))).should('eq', true);
      });
    });
  });

  it('fetches users who joined after 2 weeks ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-with-operator-and-input input[type="text"]').clear().type(oneWeekAgo).blur();
    cy.get('.filter-with-operator-and-input .el-switch').click();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.lastActive).isAfter(moment(oneWeekAgo))).should('eq', false);
      });
    });
  });

  it('fetches users who joined between 2 weeks ago and 1 week ago', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-with-operator-and-input .inline-select-input').click();
    cy.get('li.el-dropdown-menu__item').contains('between').click();
    cy.get('.filter-with-operator-and-input .el-date-editor--daterange input').eq(0).clear().type(oneWeekAgo);
    cy.get('.filter-with-operator-and-input .el-date-editor--daterange input').eq(1).type(twoDaysAgo).blur();
    cy.get('.filter-with-operator-and-input .el-switch').click();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.lastActive).isBetween(moment(oneWeekAgo).subtract(1, 'day'), moment(twoDaysAgo), 'day')).should('eq', true);
      });
    });
  });

  it('fetches users who joined between 2 weeks ago and 1 week ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.wait(100);
    cy.get('@filterItem').click();
    cy.get('.filter-with-operator-and-input .el-date-editor--daterange input').eq(0).clear().type(oneWeekAgo);
    cy.get('.filter-with-operator-and-input .el-date-editor--daterange input').eq(1).type(twoDaysAgo).blur();
    cy.get('.filter-with-operator-and-input .el-switch').click();
    cy.get('.filter-with-operator-and-input + div button.btn--primary').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(
          moment(row.lastActive).isBetween(moment(oneWeekAgo).subtract(1, 'day'), moment(twoDaysAgo), 'day')
        ).should('eq', false);
      });
    });
  });
};
