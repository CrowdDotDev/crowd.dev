import auth from './auth';
import member from './member';
import signin from './auth/signin';

Cypress.on('uncaught:exception', () => false);
Cypress.LocalStorage.clear = function () {
  return {};
};

describe('Crowd.dev', () => {
  const serverId = Cypress.env('MAILOSAUR_SERVER_ID');
  // const email = `${Date.now()}@${serverId}.mailosaur.net`;
  const email = `crowd@${serverId}.mailosaur.net`;

  before(() => {
    cy.visit(Cypress.env('appUrl'));
    localStorage.clear();
  });

  // describe('AUTH', auth({
  //   email,
  //   serverId,
  // }));

  describe('Signin', signin({
    email,
    serverId,
  }));

  describe('MEMBER', member);
});
