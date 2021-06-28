import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { has, omit, omitBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { getSuggestedTags } from '../lib/collective.lib';
import { isSectionForAdminsOnly, NAVBAR_CATEGORIES } from '../lib/collective-sections';
import expenseStatus from '../lib/constants/expense-status';
import expenseTypes from '../lib/constants/expenseTypes';
import { PayoutMethodType } from '../lib/constants/payout-method';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import { parseAmountRange } from '../components/budget/filters/AmountFilter';
import { getDateRangeFromPeriod } from '../components/budget/filters/PeriodFilter';
import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import ExpensesFilters from '../components/expenses/ExpensesFilters';
import ExpensesList from '../components/expenses/ExpensesList';
import ExpenseTags from '../components/expenses/ExpenseTags';
import { expensesListFieldsFragment } from '../components/expenses/graphql/fragments';
import { Box, Flex } from '../components/Grid';
import Link from '../components/Link';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import StyledHr from '../components/StyledHr';
import { H1, H5 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const messages = defineMessages({
  title: {
    id: 'ExpensesPage.title',
    defaultMessage: '{collectiveName} · Expenses',
  },
});

const SearchFormContainer = styled(Box)`
  width: 100%;
  max-width: 350px;
  min-width: 10rem;
`;

const EXPENSES_PER_PAGE = 10;

class ExpensePage extends React.Component {
  static getInitialProps({ query }) {
    const {
      parentCollectiveSlug,
      collectiveSlug,
      offset,
      limit,
      type,
      status,
      tag,
      amount,
      payout,
      period,
      searchTerm,
    } = query;
    return {
      parentCollectiveSlug,
      collectiveSlug,
      query: {
        offset: parseInt(offset) || undefined,
        limit: parseInt(limit) || undefined,
        type: has(expenseTypes, type) ? type : undefined,
        status: has(expenseStatus, status) || status === 'READY_TO_PAY' ? status : undefined,
        payout: has(PayoutMethodType, payout) ? payout : undefined,
        period,
        amount,
        tag,
        searchTerm,
      },
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    parentCollectiveSlug: PropTypes.string,
    LoggedInUser: PropTypes.object,
    query: PropTypes.shape({
      type: PropTypes.string,
      tag: PropTypes.string,
      searchTerm: PropTypes.string,
    }),
    /** from injectIntl */
    intl: PropTypes.object,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func,
      variables: PropTypes.shape({
        offset: PropTypes.number.isRequired,
        limit: PropTypes.number.isRequired,
      }),
      account: PropTypes.shape({
        id: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
        isArchived: PropTypes.bool,
        isHost: PropTypes.bool,
        host: PropTypes.object,
        expensesTags: PropTypes.array,
      }),
      expenses: PropTypes.shape({
        nodes: PropTypes.array,
        totalCount: PropTypes.number,
        offset: PropTypes.number,
        limit: PropTypes.number,
      }),
    }),
    router: PropTypes.object,
  };

  componentDidUpdate(oldProps) {
    const { LoggedInUser, data } = this.props;
    if (!oldProps.LoggedInUser && LoggedInUser) {
      if (LoggedInUser.canEditCollective(data.account) || LoggedInUser.isHostAdmin(data.account)) {
        data.refetch();
      }
    }
  }

  getPageMetaData(collective) {
    if (collective) {
      return { title: this.props.intl.formatMessage(messages.title, { collectiveName: collective.name }) };
    } else {
      return { title: `Expenses` };
    }
  }

  hasFilter = memoizeOne(query => {
    return Object.entries(query).some(([key, value]) => key !== 'offset' && key !== 'limit' && value);
  });

  buildFilterLinkParams(params) {
    const queryParameters = {
      ...omit(this.props.query, ['offset', 'collectiveSlug', 'parentCollectiveSlug']),
      ...params,
    };

    return omitBy(queryParameters, value => !value);
  }

  updateFilters = queryParams => {
    return this.props.router.push({
      pathname: `/${this.props.collectiveSlug}/expenses`,
      query: this.buildFilterLinkParams({ ...queryParams, offset: null }),
    });
  };

  handleSearch = searchTerm => {
    const params = this.buildFilterLinkParams({ searchTerm, offset: null });
    this.props.router.push({ pathname: `/${this.props.collectiveSlug}/expenses`, query: params });
  };

  getTagProps = tag => {
    if (tag === this.props.query.tag) {
      return { type: 'info', closeButtonProps: true };
    }
  };

  getSuggestedTags = memoizeOne(getSuggestedTags);

  render() {
    const { collectiveSlug, data, query, LoggedInUser } = this.props;
    const hasFilters = this.hasFilter(query);

    if (!data.loading) {
      if (data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account || !data.expenses?.nodes) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (!hasFeature(data.account, FEATURES.RECEIVE_EXPENSES)) {
        return <PageFeatureNotSupported />;
      } else if (
        isSectionForAdminsOnly(data.account, Sections.BUDGET) &&
        !LoggedInUser?.canEditCollective(data.account) &&
        !LoggedInUser?.isHostAdmin(data.account)
      ) {
        // Hack for funds that want to keep their budget "private"
        return <PageFeatureNotSupported showContactSupportLink={false} />;
      }
    }

    return (
      <Page collective={data.account} {...this.getPageMetaData(data.account)}>
        <CollectiveNavbar
          collective={data.account}
          isLoading={!data.account}
          selected={Sections.BUDGET}
          selectedCategory={NAVBAR_CATEGORIES.BUDGET}
        />
        <Container position="relative" minHeight={[null, 800]}>
          <Box maxWidth={1242} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
            <Flex justifyContent="space-between" flexWrap="wrap">
              <Box flex="1 1 500px" minWidth={300} maxWidth={792} mr={[0, 3, 5]} mb={5}>
                <Flex>
                  <H1 fontSize="32px" lineHeight="40px" mb={24} py={2} fontWeight="normal">
                    <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
                  </H1>
                  <Box mx="auto" />
                  <SearchFormContainer p={2}>
                    <SearchBar defaultValue={query.searchTerm} onSubmit={this.handleSearch} />
                  </SearchFormContainer>
                </Flex>
                <StyledHr mb={26} borderWidth="0.5px" />
                <Box mb={34}>
                  {data.account ? (
                    <ExpensesFilters
                      collective={data.account}
                      filters={this.props.query}
                      onChange={this.updateFilters}
                    />
                  ) : (
                    <LoadingPlaceholder height={70} />
                  )}
                </Box>
                {!data.loading && !data.expenses?.nodes.length ? (
                  <MessageBox type="info" withIcon data-cy="zero-expense-message">
                    {hasFilters ? (
                      <FormattedMessage
                        id="ExpensesList.Empty"
                        defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
                        values={{
                          ResetLink: text => (
                            <Link data-cy="reset-expenses-filters" href={`/${collectiveSlug}/expenses`}>
                              <span>{text}</span>
                            </Link>
                          ),
                        }}
                      />
                    ) : (
                      <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
                    )}
                  </MessageBox>
                ) : (
                  <React.Fragment>
                    <ExpensesList
                      isLoading={data.loading}
                      collective={data.account}
                      host={data.account?.isHost ? data.account : data.account?.host}
                      expenses={data.expenses?.nodes}
                      nbPlaceholders={data.variables.limit}
                      suggestedTags={this.getSuggestedTags(data.account)}
                    />
                    <Flex mt={5} justifyContent="center">
                      <Pagination
                        route={`/${collectiveSlug}/expenses`}
                        total={data.expenses?.totalCount}
                        limit={data.variables.limit}
                        offset={data.variables.offset}
                        ignoredQueryParams={['collectiveSlug', 'parentCollectiveSlug']}
                        scrollToTopOnChange
                      />
                    </Flex>
                  </React.Fragment>
                )}
              </Box>
              <Box minWidth={270} width={['100%', null, null, 275]} mt={70}>
                <ExpenseInfoSidebar
                  isLoading={data.loading}
                  collective={data.account}
                  host={data.account?.host}
                  tags={data.account?.expensesTags.map(({ tag }) => tag)}
                  showExpenseTypeFilters
                >
                  <H5 mb={3}>
                    <FormattedMessage id="Tags" defaultMessage="Tags" />
                  </H5>
                  <ExpenseTags
                    isLoading={data.loading}
                    expense={{ tags: data.account?.expensesTags.map(({ tag }) => tag) }}
                    limit={30}
                    getTagProps={this.getTagProps}
                    data-cy="expense-tags-title"
                  >
                    {({ key, tag, renderedTag, props }) => (
                      <Link
                        key={key}
                        href={{
                          pathname: `/${this.props.collectiveSlug}/expenses`,
                          query: this.buildFilterLinkParams({ tag: props.closeButtonProps ? null : tag }),
                        }}
                        data-cy="expense-tags-link"
                      >
                        {renderedTag}
                      </Link>
                    )}
                  </ExpenseTags>
                </ExpenseInfoSidebar>
              </Box>
            </Flex>
          </Box>
        </Container>
      </Page>
    );
  }
}

const expensesPageQuery = gqlV2/* GraphQL */ `
  query ExpensesPage(
    $collectiveSlug: String!
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
  ) {
    account(slug: $collectiveSlug) {
      id
      slug
      type
      imageUrl
      name
      currency
      isArchived
      settings
      expensesTags {
        id
        tag
      }
      features {
        ...NavbarFields
      }

      stats {
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          name
          slug
          type
          supportedPayoutMethods
          settings
          plan {
            id
          }
        }
      }

      ... on Organization {
        # We add that for hasFeature
        isHost
        isActive
      }

      ... on Event {
        parent {
          id
          name
          slug
          type
        }
      }

      ... on Project {
        parent {
          id
          name
          slug
          type
        }
      }
    }
    expenses(
      account: { slug: $collectiveSlug }
      limit: $limit
      offset: $offset
      type: $type
      tags: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
    ) {
      totalCount
      offset
      limit
      nodes {
        ...ExpensesListFieldsFragment
      }
    }
  }

  ${expensesListFieldsFragment}
  ${collectiveNavbarFieldsFragment}
`;

const addExpensesPageData = graphql(expensesPageQuery, {
  options: props => {
    const amountRange = parseAmountRange(props.query.amount);
    const [dateFrom, dateTo] = getDateRangeFromPeriod(props.query.period);
    return {
      context: API_V2_CONTEXT,
      variables: {
        collectiveSlug: props.collectiveSlug,
        offset: props.query.offset || 0,
        limit: props.query.limit || EXPENSES_PER_PAGE,
        type: props.query.type,
        status: props.query.status,
        tags: props.query.tag ? [props.query.tag] : undefined,
        minAmount: amountRange[0] && amountRange[0] * 100,
        maxAmount: amountRange[1] && amountRange[1] * 100,
        payoutMethodType: props.query.payout,
        dateFrom,
        dateTo,
        searchTerm: props.query.searchTerm,
      },
    };
  },
});

export default injectIntl(addExpensesPageData(withUser(withRouter(ExpensePage))));
