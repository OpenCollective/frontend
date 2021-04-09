import React from 'react';
import PropTypes from 'prop-types';

import OrdersWithData from '../../orders/OrdersWithData';

const FinancialContributions = ({ hostSlug }) => {
  return <OrdersWithData accountSlug={hostSlug} showPlatformTip />;
};

FinancialContributions.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default FinancialContributions;
