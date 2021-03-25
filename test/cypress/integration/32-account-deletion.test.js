import mockRecaptcha from '../mocks/recaptcha';

describe('Account Deletion', () => {
  let collectiveSlug = null;

  before(() => {
    cy.createCollective({ type: 'COLLECTIVE' }).then(({ slug }) => {
      collectiveSlug = slug;
    });
    cy.login({ redirect: `/${collectiveSlug}/edit/advanced` });
  });

  it('Should delete collective', () => {
    cy.visit(`/${collectiveSlug}/edit/advanced`);
    cy.contains('button', 'Delete this Collective', { timeout: 15000 }).click();
    cy.get('[data-cy=delete]').click();
    cy.wait(1000);
    cy.location().should(location => {
      expect(location.search).to.contains('?type=COLLECTIVE');
    });
    cy.contains('h1', 'collective has been deleted.');
  });

  it('Should delete user', () => {
    const userParams = { firstName: 'New', lastName: 'Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.signup({ user: userParams, visitParams }).then(user => {
      cy.visit(`/${user.username}/edit/advanced`);
      cy.contains('button', 'Delete this account').click();
      cy.get('[data-cy=delete]').click();
      cy.wait(1000);
      cy.location().should(location => {
        expect(location.search).to.contains('?type=USER');
      });
      cy.contains('h1', 'account has been deleted.');
    });
  });
});
