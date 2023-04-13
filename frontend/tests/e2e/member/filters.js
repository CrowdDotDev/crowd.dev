import search from './filter/search';
import noOfActivities from './filter/no-of-activities';

export default () => {
  // it('Searches inside filter', () => {
  //   cy.get('.filter-dropdown button').click();
  //   cy.get('#filterSearch').clear().type('activi');
  //   cy.get('#filterList li').each((filter) => {
  //     console.log(filter.text().toLowerCase())
  //     cy.wrap(filter.text().toLowerCase()).should('contain', 'activi');
  //   });
  // });

  // describe('Search', search);
  describe('# of activities', noOfActivities);
};
