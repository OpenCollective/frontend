import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get, omitBy } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { isSectionForAdminsOnly, NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { CollectiveType } from '../lib/constants/collectives';
import roles from '../lib/constants/roles';
import { getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import Body from '../components/Body';
import { parseAmountRange } from '../components/budget/filters/AmountFilter';
import { getDateRangeFromPeriod } from '../components/budget/filters/PeriodFilter';
import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import StyledHr from '../components/StyledHr';
import { H1 } from '../components/Text';
import { getDefaultKinds, parseTransactionKinds } from '../components/transactions/filters/TransactionsKindFilter';
import { transactionsQueryCollectionFragment } from '../components/transactions/graphql/fragments';
import TransactionsDownloadCSV from '../components/transactions/TransactionsDownloadCSV';
import TransactionsDownloadInvoices from '../components/transactions/TransactionsDownloadInvoices';
import TransactionsFilters from '../components/transactions/TransactionsFilters';
import TransactionsList from '../components/transactions/TransactionsList';
import { withUser } from '../components/UserProvider';

const transactionsPageQuery = gqlV2/* GraphQL */ `
  query TransactionsPage(
    $slug: String!
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $kinds: [TransactionKind]
  ) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      imageUrl(height: 256)
      currency
      features {
        ...NavbarFields
      }
    }
    transactions(
      account: { slug: $slug }
      limit: $limit
      offset: $offset
      type: $type
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      kinds: $kinds
      includeIncognitoTransactions: true
    ) {
      ...TransactionsQueryCollectionFragment
    }
  }
  ${transactionsQueryCollectionFragment}
  ${collectiveNavbarFieldsFragment}
`;

const TransactionPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  #footer {
    margin-top: auto;
  }
`;

const EXPENSES_PER_PAGE = 15;

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const [dateFrom, dateTo] = getDateRangeFromPeriod(query.period);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || EXPENSES_PER_PAGE,
    type: query.type,
    status: query.status,
    tags: query.tag ? [query.tag] : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    dateTo,
    searchTerm: query.searchTerm,
    kinds: query.kinds ? parseTransactionKinds(query.kinds) : getDefaultKinds(),
  };
};

class TransactionsPage extends React.Component {
  static async getInitialProps({ query: { collectiveSlug, ...query } }) {
    return { slug: collectiveSlug, query };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveNavbarData
    data: PropTypes.shape({
      account: PropTypes.object,
      transactions: PropTypes.object,
      variables: PropTypes.object,
      loading: PropTypes.bool,
      refetch: PropTypes.func,
      error: PropTypes.any,
    }).isRequired, // from withData
    LoggedInUser: PropTypes.object,
    query: PropTypes.object,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { Collective: get(props, 'data.account') };
  }

  async componentDidMount() {
    const { data } = this.props;
    const Collective = (data && data.account) || this.state.collective;
    this.setState({ Collective });
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.account');
    if (currentCollective && get(oldProps, 'data.account') !== currentCollective) {
      this.setState({ Collective: currentCollective });
    }

    // Refetch to get permissions with the currently logged in user
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.props.data?.refetch();
    }
  }

  canDownloadInvoices() {
    const { LoggedInUser } = this.props;
    const collective = get(this.props, 'data.account') || this.state.Collective;
    if (!collective || !LoggedInUser) {
      return false;
    } else if (collective.type !== 'ORGANIZATION' && collective.type !== 'USER') {
      return false;
    } else {
      return (
        LoggedInUser.isHostAdmin(collective) ||
        LoggedInUser.canEditCollective(collective) ||
        LoggedInUser.hasRole(roles.ACCOUNTANT, collective) ||
        LoggedInUser.hasRole(roles.ACCOUNTANT, collective.host)
      );
    }
  }

  updateFilters(queryParams) {
    return this.props.router.push({
      pathname: `/${this.props.slug}/transactions`,
      query: omitBy({ ...this.props.query, ...queryParams }, value => !value),
    });
  }

  render() {
    const { LoggedInUser, query, data, slug } = this.props;
    const collective = get(this.props, 'data.account') || this.state.Collective;
    const { transactions, error, loading, variables, refetch } = data || {};
    const hasFilters = Object.entries(query).some(([key, value]) => {
      return !['view', 'offset', 'limit', 'slug'].includes(key) && value;
    });
    const canDownloadInvoices = this.canDownloadInvoices();

    if (!collective && data.loading) {
      return (
        <Page title="Transactions">
          <Loading />
        </Page>
      );
    } else if (!collective) {
      return <ErrorPage data={data} />;
    } else if (
      isSectionForAdminsOnly(collective, Sections.BUDGET) &&
      !LoggedInUser?.canEditCollective(collective) &&
      !LoggedInUser?.isHostAdmin(collective)
    ) {
      // Hack for funds that want to keep their budget "private"
      return <PageFeatureNotSupported showContactSupportLink={false} />;
    }

    return (
      <TransactionPageWrapper>
        <Header
          collective={collective}
          LoggedInUser={LoggedInUser}
          noRobots={['USER', 'INDIVIDUAL'].includes(collective.type) && !collective.isHost}
        />
        <Body>
          <CollectiveNavbar
            collective={collective}
            isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
            selectedCategory={NAVBAR_CATEGORIES.BUDGET}
            selectedSection={collective.type === CollectiveType.COLLECTIVE ? Sections.BUDGET : Sections.TRANSACTIONS}
          />
          <Box maxWidth={1260} m="0 auto" px={[2, 3, 4]} py={[0, 5]} mt={3} data-cy="transactions-page-content">
            <Flex justifyContent="space-between">
              <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal" display={['none', 'block']}>
                <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />
              </H1>
              <Box p={2} flexGrow={[1, 0]}>
                <SearchBar
                  defaultValue={query.searchTerm}
                  onSubmit={searchTerm => this.updateFilters({ searchTerm, offset: null })}
                />
              </Box>
            </Flex>
            <StyledHr my="24px" mx="8px" borderWidth="0.5px" />
            <Flex
              mb={['8px', '46px']}
              mx="8px"
              justifyContent="space-between"
              flexDirection={['column', 'row']}
              alignItems={['stretch', 'flex-end']}
            >
              <TransactionsFilters
                filters={query}
                collective={collective}
                onChange={queryParams => this.updateFilters({ ...queryParams, offset: null })}
              />
              <Flex>
                {canDownloadInvoices && (
                  <Box mr="8px">
                    <TransactionsDownloadInvoices collective={collective} />
                  </Box>
                )}
                <TransactionsDownloadCSV collective={collective} />
              </Flex>
            </Flex>
            {error ? (
              <MessageBox type="error" withIcon>
                {getErrorFromGraphqlException(error).message}
              </MessageBox>
            ) : !loading && !transactions?.nodes?.length ? (
              <MessageBox type="info" withIcon data-cy="zero-transactions-message">
                {hasFilters ? (
                  <FormattedMessage
                    id="TransactionsList.Empty"
                    defaultMessage="No transactions found. <ResetLink>Reset filters</ResetLink> to see all transactions."
                    values={{
                      ResetLink(text) {
                        return (
                          <Link data-cy="reset-transactions-filters" href={`/${collective.slug}/transactions`}>
                            <span>{text}</span>
                          </Link>
                        );
                      },
                    }}
                  />
                ) : (
                  <FormattedMessage id="transactions.empty" defaultMessage="No transactions" />
                )}
              </MessageBox>
            ) : (
              <React.Fragment>
                <TransactionsList
                  isLoading={loading}
                  collective={collective}
                  nbPlaceholders={variables.limit}
                  transactions={transactions?.nodes}
                  displayActions
                  onMutationSuccess={() => refetch()}
                />
                <Flex mt={5} justifyContent="center">
                  <Pagination
                    route={`/${slug}/transactions`}
                    total={transactions?.totalCount}
                    limit={variables.limit}
                    offset={variables.offset}
                    ignoredQueryParams={['collectiveSlug']}
                    scrollToTopOnChange
                  />
                </Flex>
              </React.Fragment>
            )}
          </Box>
        </Body>
        <Footer />
      </TransactionPageWrapper>
    );
  }
}

const addTransactionsData = graphql(transactionsPageQuery, {
  options: props => {
    return {
      variables: { slug: props.slug, ...getVariablesFromQuery(props.query) },
      context: API_V2_CONTEXT,
    };
  },
});

export default withUser(addTransactionsData(withRouter(TransactionsPage)));
