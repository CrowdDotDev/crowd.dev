import signup from './auth/signup';
import verifyEmail from './auth/verifyEmail';
import signupExisting from './auth/signup-existing';
import signin from './auth/signin';
import onboarding from './auth/onboarding';
import logout from './auth/logout';
import forgotPassword from './auth/forgot-password';
import passwordReset from './auth/password-reset';

Cypress.on('uncaught:exception', () => false);
Cypress.LocalStorage.clear = function () {
  return {};
};

describe('AUTH', () => {
  const serverId = Cypress.env('MAILOSAUR_SERVER_ID');
  const email = `${new Date().getTime()}@${serverId}.mailosaur.net`;

  before(() => {
    cy.visit(Cypress.env('appUrl'));
    localStorage.clear();
  });

  it('Redirects to signin page', () => {
    cy.wait(500);
    cy.url().should('include', '/auth/signin');
  });

  describe(
    '[Auth] Signup',
    signup({
      email,
    }),
  );

  describe(
    '[Auth] Verify email',
    verifyEmail({
      email,
      serverId,
    }),
  );

  describe('[Onboarding]', onboarding);

  describe('[Auth] Logout', logout);
  describe('[Auth] Logout', signupExisting({
    email,
  }));

  describe(
    '[Auth] Forgot password',
    forgotPassword({
      email,
      serverId,
    }),
  );

  describe(
    '[Auth] Password reset',
    passwordReset({
      email,
      serverId,
    }),
  );

  describe(
    '[Auth] Signin',
    signin({
      email,
    }),
  );
});
