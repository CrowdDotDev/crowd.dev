// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --

Cypress.Commands.add('login', () => {
  cy.visit('/auth/signin')
  cy.window().should('have.property', 'app')
  cy.window()
    .its('app')
    .then(async (app) => {
      await app.$store.dispatch(
        'auth/doSigninWithEmailAndPassword',
        {
          username: 'john.doe@email.com',
          password: 'password'
        }
      )
    })
})

//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
