export default () => {
  beforeEach(() => {
    cy.get('#accountDropdown').as('accountDropdown')
    cy.get('#logout').as('logout')
  })

  it('Logs out successfully', () => {
    cy.wait(500)

    cy.get('.el-dialog .btn.btn--transparent').click()

    cy.get('@accountDropdown').click()
    cy.get('@logout').click()

    cy.url().should('include', '/auth/signin')
  })
}
