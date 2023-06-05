import auth from './auth';
import member from './member';

Cypress.on('uncaught:exception', () => false);
Cypress.LocalStorage.clear = function () {
  return {};
};

describe('Crowd.dev', () => {
  const serverId = Cypress.env('MAILOSAUR_SERVER_ID');
  const email = `${Date.now()}@${serverId}.mailosaur.net`;

  before(() => {
    cy.visit(Cypress.env('appUrl'));
    localStorage.clear();
  });

  describe('AUTH', auth({
    email,
    serverId,
  }));

  // describe('MEMBER', member);
});
