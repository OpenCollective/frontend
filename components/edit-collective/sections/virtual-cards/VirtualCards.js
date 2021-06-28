import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../../lib/graphql/helpers';

import Collapse from '../../../Collapse';
import { Box, Flex, Grid } from '../../../Grid';
import HTMLContent from '../../../HTMLContent';
import { getI18nLink } from '../../../I18nFormatters';
import Loading from '../../../Loading';
import Pagination from '../../../Pagination';
import { P } from '../../../Text';
import SettingsTitle from '../../SettingsTitle';
import VirtualCard from '../../VirtualCard';

import VirtualCardFilters from './VirtualCardFilters';

const virtualCardsQuery = gqlV2/* GraphQL */ `
  query CollectiveVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $state: String
    $merchantAccount: AccountReferenceInput
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    collective(slug: $slug) {
      id
      legacyId
      slug
      type
      name
      imageUrl
      host {
        legacyId
        slug
        id
        type
        name
        imageUrl
        settings
      }
      virtualCards(
        limit: $limit
        offset: $offset
        state: $state
        merchantAccount: $merchantAccount
        dateFrom: $dateFrom
        dateTo: $dateTo
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          privateData
          createdAt
          account {
            id
            name
            imageUrl
          }
        }
      }
      virtualCardMerchants {
        nodes {
          id
          type
          slug
          name
          currency
          location {
            address
            country
          }
          imageUrl(height: 64)
        }
      }
    }
  }
`;

const VIRTUAL_CARDS_PER_PAGE = 6;

const VirtualCards = props => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { state, merchant, period } = routerQuery;

  const { loading, data } = useQuery(virtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.collective.slug,
      limit: VIRTUAL_CARDS_PER_PAGE,
      offset,
      state,
      merchantAccount: { slug: merchant },
      dateFrom: period?.split('→')[0],
      dateTo: period?.split('→')[1] !== 'all' ? period?.split('→')[1] : null,
    },
  });

  if (loading) {
    return <Loading />;
  }

  const handleUpdateFilters = queryParams => {
    return router.push({
      pathname: `/${props.collective.slug}/edit/virtual-cards`,
      query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
    });
  };

  return (
    <Box width={['366px', '764px']}>
      <SettingsTitle>
        <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
      </SettingsTitle>

      <Box>
        <P>
          <FormattedMessage
            id="VirtualCards.Description"
            defaultMessage="Use a virtual card to spend your collective's budget. You can request multiple ones. You Fiscal Host will create them for you and assign a limit and a merchant to them. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        </P>
        {props.collective.host?.settings?.virtualcards?.policy && (
          <P mt={3}>
            <Collapse
              title={
                <FormattedMessage
                  id="VirtualCards.Policy.Reminder"
                  defaultMessage="{hostName} Virtual Card use Policy"
                  values={{
                    hostName: props.collective.host.name,
                  }}
                />
              }
            >
              <HTMLContent content={props.collective.host?.settings?.virtualcards?.policy} />
            </Collapse>
          </P>
        )}
        <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            filters={routerQuery}
            collective={props.collective}
            host={props.collective.host}
            virtualCardMerchants={data.collective.virtualCardMerchants.nodes}
            onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
            displayPeriodFilter
          />
        </Flex>
      </Box>
      <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        {data.collective.virtualCards.nodes.map(vc => (
          <VirtualCard key={vc.id} {...vc} />
        ))}
      </Grid>
      <Flex mt={5} justifyContent="center">
        <Pagination
          route={`/${props.collective.slug}/edit/virtual-cards`}
          total={data.collective.virtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
          scrollToTopOnChange
        />
      </Flex>
    </Box>
  );
};

VirtualCards.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
    virtualCards: PropTypes.object,
    virtualCardMerchants: PropTypes.array,
    host: PropTypes.object,
  }),
  hideTopsection: PropTypes.func,
};

export default VirtualCards;
