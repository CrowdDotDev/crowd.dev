export default (inject) => () => {
  let verifyUrl
  it('Opens verify link', () => {
    cy.mailosaurGetMessage(inject.serverId, {
      sentTo: inject.email
    }).then((email) => {
      verifyUrl = email.text.links[0].href
      cy.visit(verifyUrl)
    })
  })

  it('Redirects to signin or onboarding after successfull verification', () => {
    cy.location('pathname').should('be.oneOf', [
      '/onboard',
      '/auth/signin'
    ])
  })
}
