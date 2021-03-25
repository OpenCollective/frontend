import { defineMessages } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { hasSection, NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import i18nCollectivePageSection from '../../lib/i18n-collective-page-section';

import { Sections } from '../collective-page/_constants';

export const NAVBAR_ACTION_TYPE = {
  SUBMIT_EXPENSE: 'hasSubmitExpense',
  DASHBOARD: 'hasDashboard',
  APPLY: 'hasApply',
  CONTACT: 'hasContact',
  ADD_PREPAID_BUDGET: 'addPrepaidBudget',
  ADD_FUNDS: 'addFunds',
  CONTRIBUTE: 'hasContribute',
  MANAGE_SUBSCRIPTIONS: 'hasManageSubscriptions',
  REQUEST_GRANT: 'hasRequestGrant',
  SETTINGS: 'hasSettings',
  DELETE: 'hasDelete',
};

const titles = defineMessages({
  CONTRIBUTE: {
    id: 'SectionContribute.All',
    defaultMessage: 'All ways to contribute',
  },
  TRANSACTIONS: {
    id: 'SectionTransactions.Title',
    defaultMessage: 'Transactions',
  },
  EXPENSES: {
    id: 'section.expenses.title',
    defaultMessage: 'Expenses',
  },
  UPDATES: {
    id: 'updates',
    defaultMessage: 'Updates',
  },
  CONVERSATIONS: {
    id: 'conversations',
    defaultMessage: 'Conversations',
  },
});

const addSectionLink = (intl, links, collective, sections, section) => {
  if (hasSection(sections, section)) {
    links.push({
      route: `/${collective.slug}#section-${section}`,
      title: i18nCollectivePageSection(intl, section),
      hide: true, // Section links are not displayed yet
    });
  }
};

/**
 * Builds all menu entries, based on categories & enabled features
 */
const getCategoryMenuLinks = (intl, collective, sections, category) => {
  const links = [];
  const collectiveSlug = collective.slug;

  if (category === NAVBAR_CATEGORIES.ABOUT) {
    // About
    addSectionLink(intl, links, collective, sections, Sections.ABOUT);
    addSectionLink(intl, links, collective, sections, Sections.OUR_TEAM);
    addSectionLink(intl, links, collective, sections, Sections.CONNECTED_COLLECTIVES);
    addSectionLink(intl, links, collective, sections, Sections.GOALS);
  } else if (category === NAVBAR_CATEGORIES.CONTRIBUTE) {
    // Contribute
    if (hasFeature(collective, FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS) && hasSection(sections, Sections.CONTRIBUTE)) {
      links.push({
        route: `/${collectiveSlug}/contribute`,
        title: intl.formatMessage(titles.CONTRIBUTE),
      });
    }

    addSectionLink(intl, links, collective, sections, Sections.EVENTS);
    addSectionLink(intl, links, collective, sections, Sections.PROJECTS);
  } else if (category === NAVBAR_CATEGORIES.CONTRIBUTIONS) {
    addSectionLink(intl, links, collective, sections, Sections.CONTRIBUTIONS);
  } else if (category === NAVBAR_CATEGORIES.BUDGET) {
    // Budget
    links.push({
      route: `/${collectiveSlug}/transactions`,
      title: intl.formatMessage(titles.TRANSACTIONS),
    });

    if (hasFeature(collective, FEATURES.RECEIVE_EXPENSES)) {
      links.push({
        route: `/${collectiveSlug}/expenses`,
        title: intl.formatMessage(titles.EXPENSES),
      });
    }
  } else if (category === NAVBAR_CATEGORIES.CONNECT) {
    // Connect
    if (hasFeature(collective, FEATURES.UPDATES) && hasSection(sections, Sections.UPDATES)) {
      links.push({
        route: `/${collectiveSlug}/updates`,
        title: intl.formatMessage(titles.UPDATES),
      });
    }
    if (hasFeature(collective, FEATURES.CONVERSATIONS) && hasSection(sections, Sections.CONVERSATIONS)) {
      links.push({
        route: `/${collectiveSlug}/conversations`,
        title: intl.formatMessage(titles.CONVERSATIONS),
      });
    }
  }

  return links;
};

export const getNavBarMenu = (intl, collective, sections) => {
  const menu = [];
  sections.forEach(({ type, name }) => {
    if (type === 'CATEGORY') {
      const links = getCategoryMenuLinks(intl, collective, sections, name);
      if (links.length) {
        menu.push({ category: name, links });
      }
    }
  });

  return menu;
};
