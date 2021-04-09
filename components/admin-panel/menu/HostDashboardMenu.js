import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { HOST_SECTIONS } from '../../host-dashboard/constants';

import MenuLink from './MenuLink';

const HostDashboardMenu = ({ host, selectedSection }) => {
  return (
    <ul>
      <MenuLink collective={host} section={HOST_SECTIONS.EXPENSES} selectedSection={selectedSection}>
        <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
      </MenuLink>
      <MenuLink collective={host} section={HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS} selectedSection={selectedSection}>
        <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />
      </MenuLink>
      <MenuLink collective={host} section={HOST_SECTIONS.PENDING_APPLICATIONS} selectedSection={selectedSection}>
        <FormattedMessage id="host.dashboard.tab.pendingApplications" defaultMessage="Pending applications" />
      </MenuLink>
      <MenuLink collective={host} section={HOST_SECTIONS.HOSTED_COLLECTIVES} selectedSection={selectedSection}>
        <FormattedMessage id="HostedCollectives" defaultMessage="Hosted Collectives" />
      </MenuLink>
    </ul>
  );
};

HostDashboardMenu.propTypes = {
  selectedSection: PropTypes.string,
  host: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

export default HostDashboardMenu;
