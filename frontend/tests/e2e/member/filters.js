import search from './filter/search';
import noOfActivities from './filter/no-of-activities';
import noOfOpenSourceContributions from './filter/no-of-open-source-contributions';
import activeOn from './filter/active-on';
import activityType from './filter/activity-type';
import avgSentiment from './filter/avg-sentiment';
import engagementLevel from './filter/engagement-level';
import enrichedMember from './filter/enriched-member';
import identities from './filter/identities';
import reach from './filter/reach';
import joinedDate from './filter/joined-date';
import lastActivityDate from './filter/last-activity-date';
import customAttributes from './filter/custom-attributes';

export default () => {
  it('Searches inside filter', () => {
    cy.get('[data-qa="filter-dropdown"]').click();
    cy.get('[data-qa="filter-list-search"]').clear().type('activi');
    cy.get('[data-qa="filter-list-item"]').each((filter) => {
      cy.wrap(filter.text().toLowerCase()).should('contain', 'activi');
    });
    cy.get('[data-qa="filter-list-search"]').clear();
    cy.get('[data-qa="filter-dropdown"]').click();
  });

  describe('Search', search);
  describe('# of activities', noOfActivities);
  describe('# of open source contributions', noOfOpenSourceContributions);
  describe('Active on', activeOn);
  describe('Activity type', activityType);
  describe('Avg. sentiment', avgSentiment);
  describe('Engagement level', engagementLevel);
  describe('Enriched member', enrichedMember);
  describe('Identities', identities);
  describe('Reach', reach);
  describe('Joined date', joinedDate);
  describe('Last activity date', lastActivityDate);
  describe('Custom attributes', customAttributes);
};
