import signup from './signup';
import verifyEmail from './verifyEmail';
import signupExisting from './signup-existing';
import signin from './signin';
import onboarding from './onboarding';
import logout from './logout';
import forgotPassword from './forgot-password';
import passwordReset from './password-reset';

export default ({ email, serverId }) => () => {
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
  describe('[Auth] Signup existing', signupExisting({
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
};
