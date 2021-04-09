import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { HOST_SECTIONS } from '../../host-dashboard/constants';

import MenuLink from './MenuLink';

const GeneralSettingsMenu = ({ collective }) => {
  return (
    <ul>
      <MenuLink collective={collective} section={HOST_SECTIONS.EXPENSES}>
        <span>Organization settings</span>
        <span>&rarr;</span>
      </MenuLink>
      <MenuLink collective={collective} section="info">
        <FormattedMessage id="Settings.FiscalHost" defaultMessage="Fiscal Host Settings" />
      </MenuLink>
    </ul>
  );
};

GeneralSettingsMenu.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

export default GeneralSettingsMenu;
