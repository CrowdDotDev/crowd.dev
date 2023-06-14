import moment from 'moment';

export default () => {
  const twoWeeksAgo = moment().subtract(14, 'day').format('YYYY-MM-DD');
  const oneWeekAgo = moment().subtract(7, 'day').format('YYYY-MM-DD');

  before(() => {
    cy.wait(1000);
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-item"]').contains('Joined date').click();
  });

  beforeEach(() => {
    cy.scrollTo(0, 0);
    cy.server();
    cy.route('POST', '/api/tenant/*/member/query').as('apiMemberQuery');
    cy.get('[data-qa="filter-list-chip"]').as('filterItem');
    cy.wait(100);
  });

  after(() => {
    cy.scrollTo(0, 0);
    cy.get('[data-qa="filter-list-chip-close"]').click({ force: true });
  });

  it('has apply button disabled if empty field', () => {
    cy.get('[data-qa="filter-apply"]').should('be.disabled');
  });

  it('corrects date if invalid date entered', () => {
    cy.get('[data-qa="filter-date-input"] input').as('dateField');
    cy.get('@dateField').clear().type('500-01-2023').blur();
    cy.get('@dateField').should('have.value', '2023-01-01');
  });

  it('fetches users who joined 2 weeks ago', () => {
    cy.get('[data-qa="filter-date-input"] input').clear().type(twoWeeksAgo).blur();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isSame(twoWeeksAgo, 'day')).should('eq', true);
      });
    });
  });

  it('fetches users who joined 2 weeks ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-date-input"] input').clear().type(twoWeeksAgo).blur();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isSame(twoWeeksAgo, 'day')).should('eq', false);
      });
    });
  });

  it('fetches users who joined before 2 weeks ago', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-date-input"] input').clear().type(twoWeeksAgo).blur();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('is before').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isBefore(moment(twoWeeksAgo))).should('eq', true);
      });
    });
  });

  it('fetches users who joined before 2 weeks ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-date-input"] input').clear().type(twoWeeksAgo).blur();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isBefore(moment(twoWeeksAgo))).should('eq', false);
      });
    });
  });

  it('fetches users who joined after 2 weeks ago', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-date-input"] input').clear().type(twoWeeksAgo).blur();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('is after').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isAfter(moment(twoWeeksAgo))).should('eq', true);
      });
    });
  });

  it('fetches users who joined after 2 weeks ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-date-input"] input').clear().type(twoWeeksAgo).blur();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isAfter(moment(twoWeeksAgo))).should('eq', false);
      });
    });
  });

  it('fetches users who joined between 2 weeks ago and 1 week ago', () => {
    cy.get('@filterItem').click();
    cy.get('.filter-list-item-popper [data-qa="filter-inline-select"]').click();
    cy.get('[data-qa="filter-inline-select-option"]').contains('between').click();
    cy.get('[data-qa="filter-date-input"] input').eq(0).clear().type(twoWeeksAgo);
    cy.get('[data-qa="filter-date-input"] input').eq(1).type(oneWeekAgo).blur();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(moment(row.joinedAt).isAfter(moment(twoWeeksAgo))).should('eq', true);
        cy.wrap(moment(row.joinedAt).isBefore(moment(oneWeekAgo))).should('eq', true);
      });
    });
  });

  it('fetches users who joined between 2 weeks ago and 1 week ago - exclude', () => {
    cy.get('@filterItem').click();
    cy.get('[data-qa="filter-include-switch"]').click();
    cy.get('[data-qa="filter-apply"]').click();
    cy.wait('@apiMemberQuery');

    cy.get('@apiMemberQuery').then((req) => {
      const { rows } = req.response.body;
      rows.forEach((row) => {
        cy.wrap(
          moment(row.joinedAt).isAfter(moment(twoWeeksAgo))
          && moment(row.joinedAt).isBefore(moment(oneWeekAgo)),
        ).should('eq', false);
      });
    });
  });
};
