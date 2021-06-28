import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { usePrevious } from '../../lib/hooks/usePrevious';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import { getDateRangeFromPeriod } from '../budget/filters/PeriodFilter';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';
import { useUser } from '../UserProvider';

import OrdersFilters from './OrdersFilters';
import OrdersList from './OrdersList';

const accountOrdersQuery = gqlV2/* GraphQL */ `
  query Orders(
    $accountSlug: String
    $limit: Int!
    $offset: Int!
    $status: OrderStatus
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
  ) {
    account(slug: $accountSlug) {
      id
      slug
      currency
    }
    orders(
      account: { slug: $accountSlug }
      includeHostedAccounts: true
      filter: INCOMING
      status: $status
      searchTerm: $searchTerm
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
      minAmount: $minAmount
      maxAmount: $maxAmount
    ) {
      totalCount
      nodes {
        id
        legacyId
        description
        createdAt
        status
        amount {
          valueInCents
          currency
        }
        platformContributionAmount {
          valueInCents
          currency
        }
        paymentMethod {
          id
          providerType
        }
        fromAccount {
          id
          slug
          name
          imageUrl
        }
        toAccount {
          id
          slug
          name
          imageUrl
        }
        permissions {
          id
          canMarkAsExpired
          canMarkAsPaid
        }
      }
    }
  }
`;

const ORDERS_PER_PAGE = 15;

const isValidStatus = status => {
  return Boolean(ORDER_STATUS[status]);
};

const getVariablesFromQuery = (query, forcedStatus) => {
  const amountRange = parseAmountRange(query.amount);
  const [dateFrom, dateTo] = getDateRangeFromPeriod(query.period);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || ORDERS_PER_PAGE,
    status: forcedStatus ? forcedStatus : isValidStatus(query.status) ? query.status : null,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    dateFrom,
    dateTo,
    searchTerm: query.searchTerm,
  };
};

const hasParams = query => {
  return Object.entries(query).some(([key, value]) => {
    return (
      ![
        'collectiveSlug',
        'hostCollectiveSlug',
        'limit',
        'offset',
        'paypalApprovalError',
        'section',
        'slug',
        'view',
      ].includes(key) && value
    );
  });
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'collectiveSlug', 'view'];

const updateQuery = (router, newParams) => {
  const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  const pathname = router.asPath.split('?')[0];
  return router.push({ pathname, query });
};

const OrdersWithData = ({ accountSlug, title, status, showPlatformTip }) => {
  const router = useRouter() || { query: {} };
  const hasFilters = React.useMemo(() => hasParams(router.query), [router.query]);
  const queryVariables = { accountSlug, ...getVariablesFromQuery(router.query, status) };
  const queryParams = { variables: queryVariables, context: API_V2_CONTEXT };
  const { data, error, loading, variables, refetch } = useQuery(accountOrdersQuery, queryParams);
  const { LoggedInUser } = useUser();
  const prevLoggedInUser = usePrevious(LoggedInUser);

  // Refetch data when user logs in
  React.useEffect(() => {
    if (!prevLoggedInUser && LoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  return (
    <Box maxWidth={1000} width="100%" m="0 auto" px={2}>
      <Flex>
        <H1 fontSize="32px" lineHeight="40px" mb={24} py={2} fontWeight="normal">
          {title || <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />}
        </H1>
        <Box mx="auto" />
        <Box p={2}>
          <SearchBar
            defaultValue={router.query.searchTerm}
            onSubmit={searchTerm => updateQuery(router, { searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" borderColor="black.300" />
      <Box mb={34} maxWidth={500}>
        {data?.account ? (
          <OrdersFilters
            currency={data.account.currency}
            filters={router.query}
            onChange={queryParams => updateQuery(router, { ...queryParams, offset: null })}
            hasStatus={!status}
          />
        ) : loading ? (
          <LoadingPlaceholder height={70} />
        ) : null}
      </Box>
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data.orders?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-order-message">
          {hasFilters ? (
            <FormattedMessage
              id="OrdersList.Empty"
              defaultMessage="No contributions match the given filters. <ResetLink>Reset</ResetLink> to see all."
              values={{
                ResetLink(text) {
                  return (
                    <Link data-cy="reset-orders-filters" href={{ pathname: router.asPath.split('?')[0], query: {} }}>
                      {text}
                    </Link>
                  );
                },
              }}
            />
          ) : (
            <FormattedMessage id="orders.empty" defaultMessage="No orders" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <OrdersList
            isLoading={loading}
            orders={data?.orders?.nodes}
            nbPlaceholders={variables.limit}
            showPlatformTip={showPlatformTip}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              total={data?.orders?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
              scrollToTopOnChanges
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

OrdersWithData.propTypes = {
  accountSlug: PropTypes.string.isRequired,
  /** If provided, only orders matching this status will be fetched */
  status: PropTypes.string,
  /** An optional title to be used instead of "Financial contributions" */
  title: PropTypes.node,
  showPlatformTip: PropTypes.bool,
};

export default OrdersWithData;
