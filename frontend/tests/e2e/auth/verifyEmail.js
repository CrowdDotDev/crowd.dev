export default (inject) => () => {
  let verifyUrl;
  it('Opens verify link', () => {
    cy.server();
    cy.route('PUT', '/api/auth/verify-email').as('apiAuthVerifyEmail');
    cy.route('GET', '/api/auth/me').as('apiAuthMe');
    cy.mailosaurGetMessage(inject.serverId, {
      sentTo: inject.email,
    }).then((email) => {
      verifyUrl = email.text.links[0].href;
      cy.visit(verifyUrl);
      cy.wait('@apiAuthVerifyEmail');
      cy.wait('@apiAuthMe');
    });
  });

  it('Redirects to signin or onboarding after successfull verification', () => {
    cy.location('pathname').should('eq', '/onboard');
  });
};
