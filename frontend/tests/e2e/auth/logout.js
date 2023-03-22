export default () => {
  beforeEach(() => {
    cy.get('#accountDropdown').as('accountDropdown')
  })

  it('Logs out successfully', () => {
    cy.wait(500)

    cy.get('@accountDropdown').click()
    cy.wait(100)
    cy.get('#logout').as('logout')
    cy.get('@logout').click()

    cy.url().should('include', '/auth/signin')
  })
}
