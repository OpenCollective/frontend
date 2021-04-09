import React from 'react';
import PropTypes from 'prop-types';

import Container from '../Container';
import { HOST_SECTIONS } from '../host-dashboard/constants';
import HostDashboardExpenses from '../host-dashboard/HostDashboardExpenses';
import HostDashboardHostedCollectives from '../host-dashboard/HostDashboardHostedCollectives';
import PendingApplications from '../host-dashboard/PendingApplications';
import Loading from '../Loading';
import NotFound from '../NotFound';

import FinancialContributions from './sections/FinancialContributions';

const HOST_ADMIN_SECTIONS = {
  [HOST_SECTIONS.HOSTED_COLLECTIVES]: HostDashboardHostedCollectives,
  [HOST_SECTIONS.FINANCIAL_CONTRIBUTIONS]: FinancialContributions,
  [HOST_SECTIONS.EXPENSES]: HostDashboardExpenses,
  [HOST_SECTIONS.PENDING_APPLICATIONS]: PendingApplications,
};

const AdminPanelSection = ({ collective, isLoading, section }) => {
  const AdminSectionComponent = HOST_ADMIN_SECTIONS[section];
  if (!AdminSectionComponent) {
    return (
      <Container display="flex" justifyContent="center" alignItems="center">
        {AdminSectionComponent ? <AdminSectionComponent hostSlug={collective.slug} /> : <NotFound />}
      </Container>
    );
  } else if (isLoading) {
    return (
      <Container display="flex" justifyContent="center" alignItems="center">
        <Loading />
      </Container>
    );
  }

  return (
    <Container width="100%">
      <AdminSectionComponent hostSlug={collective.slug} />
    </Container>
  );
};

AdminPanelSection.propTypes = {
  isLoading: PropTypes.bool,
  section: PropTypes.string,
  /** The account. Can be null if isLoading is true */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default AdminPanelSection;
