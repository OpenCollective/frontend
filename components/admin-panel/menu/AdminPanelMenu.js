import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Avatar from '../../Avatar';
import { Box } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledButton from '../../StyledButton';
import { H1 } from '../../Text';

import GeneralSettingsMenu from './GeneralSettingsMenu';
import HostDashboardMenu from './HostDashboardMenu';

const MenuSectionHeader = styled.div`
  font-weight: 500;
  font-size: 11px;
  line-height: 12px;
  text-transform: uppercase;
  text-align: center;
  padding: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.black[400]};
  color: ${props => props.theme.colors.black[700]};
`;

const MenuContainer = styled.ul`
  margin: 0;
  margin-bottom: 100px;

  &,
  & ul {
    list-style-type: none;
    padding: 0;
  }

  ul {
    margin: 0;
  }
`;

const AdminPanelMenu = ({ collectiveSlug, collective, isLoading, selectedSection }) => {
  return (
    <MenuContainer>
      <Box mb={32}>
        <Avatar collective={collective} radius={56} />

        <H1 fontSize="16px" lineHeight="24px" fontWeight="700" letterSpacing="0.04px" mb={16} mt={12}>
          {isLoading ? <LoadingPlaceholder /> : collective.name}
        </H1>

        <Box>
          <Link href={`/${collectiveSlug}`}>
            <StyledButton buttonSize="tiny">
              <FormattedMessage id="AdminPanel.Exit" defaultMessage="Exit Admin Panel" />
            </StyledButton>
          </Link>
        </Box>
      </Box>

      {isLoading ? (
        [...Array(5).keys()].map(i => (
          <li key={i}>
            <LoadingPlaceholder height={24} mb={2} borderRadius={8} />
          </li>
        ))
      ) : (
        <React.Fragment>
          {collective.isHost && (
            <Box as="li" mb={24}>
              <MenuSectionHeader>
                <FormattedMessage id="AdminPanel.AdminFeatures" defaultMessage="Administration features" />
              </MenuSectionHeader>
              <HostDashboardMenu host={collective} selectedSection={selectedSection} />
            </Box>
          )}
          <li>
            {collective.isHost && (
              <MenuSectionHeader>
                <FormattedMessage id="AdminPanel.General" defaultMessage="General" />
              </MenuSectionHeader>
            )}
            <GeneralSettingsMenu collective={collective} selectedSection={selectedSection} />
          </li>
        </React.Fragment>
      )}
    </MenuContainer>
  );
};

AdminPanelMenu.propTypes = {
  isLoading: PropTypes.bool,
  selectedSection: PropTypes.string,
  collectiveSlug: PropTypes.string.isRequired,
  /** The account. Can be null if isLoading is true */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default AdminPanelMenu;
