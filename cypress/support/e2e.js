
Cypress.Commands.add('resetDB', () => {
  cy.request('POST', 'http://localhost:3010/api/reset');
});

Cypress.Commands.add('getItems', () => {
  return cy.request('GET', 'http://localhost:3010/api/books').its('body');
});

beforeEach(() => {
  cy.resetDB();
});
