import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { cloneDeep, orderBy, set } from 'lodash';
import memoizeOne from 'memoize-one';
import dynamic from 'next/dynamic';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { TierTypes } from '../../../lib/constants/tiers-types';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { canOrderTicketsFromEvent, isPastEvent } from '../../../lib/events';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { getCollectiveContributionCardsOrder, sortTiers, TIERS_ORDER_KEY } from '../../../lib/tier-utils';

import Container from '../../Container';
import ContainerOverlay from '../../ContainerOverlay';
import { CONTRIBUTE_CARD_WIDTH } from '../../contribute-cards/Contribute';
import ContributeCardContainer, { CONTRIBUTE_CARD_PADDING_X } from '../../contribute-cards/ContributeCardContainer';
import ContributeCustom from '../../contribute-cards/ContributeCustom';
import ContributeTier from '../../contribute-cards/ContributeTier';
import CreateNew from '../../contribute-cards/CreateNew';
import { Box, Flex } from '../../Grid';
import HorizontalScroller from '../../HorizontalScroller';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import StyledSpinner from '../../StyledSpinner';
import { H3, P } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import ContributeCardsContainer from '../ContributeCardsContainer';
import { editAccountSettingMutation } from '../graphql/mutations';
import { collectivePageQuery, getCollectivePageQueryVariables } from '../graphql/queries';
import SectionTitle from '../SectionTitle';

// Dynamic imports
const AdminContributeCardsContainer = dynamic(() => import('../../contribute-cards/AdminContributeCardsContainer'), {
  ssr: false,
});

/**
 * The contribute section, implemented as a pure component to avoid unnecessary
 * re-renders when scrolling.
 */
class SectionContribute extends React.PureComponent {
  static propTypes = {
    tiers: PropTypes.arrayOf(PropTypes.object),
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        contributors: PropTypes.arrayOf(PropTypes.object),
      }),
    ),
    connectedCollectives: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        collective: PropTypes.shape({
          id: PropTypes.number.isRequired,
        }),
      }),
    ),
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
      isHost: PropTypes.bool,
      host: PropTypes.object,
      currency: PropTypes.string,
      settings: PropTypes.object,
      parentCollective: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }),
      name: PropTypes.string,
    }),
    contributorsStats: PropTypes.object,
    contributors: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        isBacker: PropTypes.bool,
        tiersIds: PropTypes.arrayOf(PropTypes.number),
      }),
    ),
    isAdmin: PropTypes.bool,
    editAccountSettings: PropTypes.func.isRequired,
  };

  state = {
    showTiersAdmin: false,
    draggingContributionsOrder: null,
    isSaving: false,
  };

  onTiersAdminReady = () => {
    this.setState({ showTiersAdmin: true });
  };

  getFinancialContributorsWithoutTier = memoizeOne(contributors => {
    return contributors.filter(c => c.isBacker && (c.tiersIds.length === 0 || c.tiersIds[0] === null));
  });

  hasContributors = memoizeOne(contributors => {
    return contributors.find(c => c.isBacker);
  });

  onContributionCardMove = memoizeOne((dragIndex, hoverIndex) => {
    this.setState(() => {
      const baseCardsOrder = getCollectiveContributionCardsOrder(this.props.collective);
      const sortedTiers = this.getSortedCollectiveTiers(this.props.tiers, baseCardsOrder);
      const cardKeys = [...this.getFinancialContributions(sortedTiers).map(c => c.key)];
      cardKeys.splice(hoverIndex, 0, cardKeys.splice(dragIndex, 1)[0]);
      return { draggingContributionsOrder: cardKeys };
    });
  });

  onContributionCardDrop = async (dragIndex, hoverIndex) => {
    const { collective, tiers, editAccountSettings } = this.props;

    // No need to update if not moving the card
    if (dragIndex === hoverIndex) {
      return this.setState({ draggingContributionsOrder: null });
    }

    // Save the new positions
    this.setState({ isSaving: true });
    try {
      const baseCardsOrder = getCollectiveContributionCardsOrder(collective);
      const sortedTiers = this.getSortedCollectiveTiers(tiers, baseCardsOrder);
      const cardKeys = [...this.getFinancialContributions(sortedTiers).map(c => c.key)];
      cardKeys.splice(hoverIndex, 0, cardKeys.splice(dragIndex, 1)[0]);
      const mutationVariables = { collectiveId: collective.id, key: TIERS_ORDER_KEY, value: cardKeys };
      await editAccountSettings({
        variables: mutationVariables,
        update: (store, response) => {
          // We need to update the store manually because the response comes from API V2
          const collectivePageQueryVariables = getCollectivePageQueryVariables(collective.slug);
          const data = store.readQuery({ query: collectivePageQuery, variables: collectivePageQueryVariables });
          const newData = set(cloneDeep(data), 'Collective.settings', response.data.editAccountSetting.settings);
          store.writeQuery({ query: collectivePageQuery, variables: collectivePageQueryVariables, data: newData });
        },
      });
      this.setState({ isSaving: false, draggingContributionsOrder: null });
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSaving: false });
    }
  };

  getContributeCardsScrollDistance(width) {
    const oneCardScrollDistance = CONTRIBUTE_CARD_WIDTH + CONTRIBUTE_CARD_PADDING_X[0] * 2;
    if (width <= oneCardScrollDistance * 2) {
      return oneCardScrollDistance;
    } else if (width <= oneCardScrollDistance * 4) {
      return oneCardScrollDistance * 2;
    } else {
      return oneCardScrollDistance * 3;
    }
  }

  getSortedCollectiveTiers = memoizeOne((baseTiers, orderKeys) => {
    return sortTiers(baseTiers, orderKeys, true);
  });

  getFinancialContributions = memoizeOne(sortedTiers => {
    const { collective, contributors, contributorsStats } = this.props;
    const hasNoContributor = !this.hasContributors(contributors);
    const canContribute = collective.isActive && !isPastEvent(collective);
    const hasCustomContribution = !collective.settings?.disableCustomContributions;
    const waysToContribute = [];

    sortedTiers.forEach(tier => {
      if (tier === 'custom') {
        if (hasCustomContribution) {
          waysToContribute.push({
            key: 'custom',
            Component: ContributeCustom,
            componentProps: {
              collective,
              contributors: this.getFinancialContributorsWithoutTier(contributors),
              stats: contributorsStats,
              hideContributors: hasNoContributor,
              disableCTA: !canContribute,
            },
          });
        }
      } else {
        waysToContribute.push({
          key: tier.id,
          Component: ContributeTier,
          componentProps: { collective, tier, hideContributors: hasNoContributor },
        });
      }
    });

    return waysToContribute;
  });

  sortTicketTiers = memoizeOne(tiers => {
    return orderBy([...tiers], ['endsAt'], ['desc']);
  });

  filterTickets = memoizeOne(tiers => {
    return tiers.filter(tier => tier.type === TierTypes.TICKET);
  });

  render() {
    const { collective, tiers, events, connectedCollectives, contributors, isAdmin } = this.props;
    const { draggingContributionsOrder, isSaving, showTiersAdmin } = this.state;
    const orderKeys = draggingContributionsOrder || getCollectiveContributionCardsOrder(collective);
    const sortedTiers = this.getSortedCollectiveTiers(tiers, orderKeys);
    const isEvent = collective.type === CollectiveType.EVENT;
    const isProject = collective.type === CollectiveType.PROJECT;
    const isFund = collective.type === CollectiveType.FUND;
    const hasCustomContribution = !collective.settings?.disableCustomContributions;
    const hasContribute = isAdmin || (collective.isActive && (sortedTiers.length || hasCustomContribution));
    const hasOtherWaysToContribute =
      !isEvent && !isProject && !isFund && (isAdmin || events.length > 0 || connectedCollectives.length > 0);
    const isActive = collective.isActive;
    const hasHost = collective.host;
    const isHost = collective.isHost;
    const waysToContribute = this.getFinancialContributions(sortedTiers);
    const hasNoContributor = !this.hasContributors(contributors);
    const sortedTicketTiers = this.sortTicketTiers(this.filterTickets(tiers));
    const hideTicketsFromNonAdmins = (sortedTicketTiers.length === 0 || !collective.isActive) && !isAdmin;
    const cannotOrderTickets = (!hasContribute && !isAdmin) || (!canOrderTicketsFromEvent(collective) && !isAdmin);

    /*
    cases

    1. admin + no host = Contribute Section and 'Start accepting financial contributions' ✅
    2a. admin + host = normal Contribute section ✅
    2b. not admin + Collective active = normal Contribute section ???
    3. not admin + Collective not active + no connectedcollectives/events = display nothing ✅
    */

    if (!hasContribute && !hasOtherWaysToContribute) {
      return null;
    }

    return (
      <Fragment>
        {/* "Start accepting financial contributions" for admins */}
        {isAdmin && !hasHost && !isHost && (
          <ContainerSectionContent py={4}>
            <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <P color="black.700" my={2} mr={2} css={{ flex: '1 0 50%', maxWidth: 780 }}>
                <FormattedMessage
                  id="contributions.subtitle"
                  defaultMessage="To accept financial contributions, you need to complete your setup and decide where your funds will be held."
                />
              </P>
            </Flex>
            <Box my={5}>
              <Link href={`/${collective.slug}/accept-financial-contributions`}>
                <StyledButton buttonStyle="primary" buttonSize="large">
                  <FormattedMessage id="contributions.startAccepting" defaultMessage="Start accepting contributions" />
                </StyledButton>
              </Link>
            </Box>
          </ContainerSectionContent>
        )}

        {((isAdmin && hasHost) || (isAdmin && isHost) || (!isAdmin && isActive)) && (
          <Fragment>
            {/* Financial contributions tiers */}
            {hasContribute && (
              <Fragment>
                <ContainerSectionContent>
                  <SectionTitle>
                    <FormattedMessage
                      id="CollectivePage.SectionFinancialContributions.title"
                      defaultMessage="Financial Contributions"
                    />
                  </SectionTitle>
                </ContainerSectionContent>
                <Box pb={4} data-cy="financial-contributions">
                  <HorizontalScroller
                    getScrollDistance={this.getContributeCardsScrollDistance}
                    container={ContributeCardsContainer}
                    containerProps={{ disableScrollSnapping: Boolean(draggingContributionsOrder) }}
                  >
                    <React.Fragment>
                      {isSaving && (
                        <ContainerOverlay position="fixed" top={0} alignItems="center">
                          <StyledSpinner size={64} />
                          <P mt={3} fontSize="15px">
                            <FormattedMessage id="Saving" defaultMessage="Saving..." />
                          </P>
                        </ContainerOverlay>
                      )}
                      {!(isAdmin && showTiersAdmin) &&
                        waysToContribute.map(({ key, Component, componentProps }) => (
                          <ContributeCardContainer key={key}>
                            <Component {...componentProps} />
                          </ContributeCardContainer>
                        ))}
                      {isAdmin && (
                        <Container display={showTiersAdmin ? 'block' : 'none'} data-cy="admin-contribute-cards">
                          <AdminContributeCardsContainer
                            collective={collective}
                            cards={waysToContribute}
                            onContributionCardMove={this.onContributionCardMove}
                            onContributionCardDrop={this.onContributionCardDrop}
                            onMount={this.onTiersAdminReady}
                          />
                        </Container>
                      )}
                    </React.Fragment>
                  </HorizontalScroller>
                </Box>
              </Fragment>
            )}

            {/* Tickets for type EVENT */}
            {isEvent && !cannotOrderTickets && !hideTicketsFromNonAdmins && (
              <Box pb={4} data-cy="Tickets">
                <ContainerSectionContent>
                  <Flex alignItems="left" mb={3}>
                    <H3 fontSize="20px" fontWeight="600" color="black.700">
                      <FormattedMessage id="section.tickets.title" defaultMessage="Tickets" />
                    </H3>
                  </Flex>
                </ContainerSectionContent>
                <HorizontalScroller
                  container={ContributeCardsContainer}
                  getScrollDistance={this.getContributeCardsScrollDistance}
                >
                  {sortedTicketTiers.map(tier => (
                    <ContributeCardContainer key={tier.id}>
                      <ContributeTier
                        collective={collective}
                        tier={tier}
                        hideContributors={hasNoContributor}
                        disableCTA={!collective.isActive}
                      />
                    </ContributeCardContainer>
                  ))}
                  {isAdmin && (
                    <ContributeCardContainer minHeight={150}>
                      <CreateNew route={`/${collective.parentCollective.slug}/events/${collective.slug}/edit/tickets`}>
                        <FormattedMessage id="SectionTickets.CreateTicket" defaultMessage="Create Ticket" />
                      </CreateNew>
                    </ContributeCardContainer>
                  )}
                </HorizontalScroller>
              </Box>
            )}

            {/* "View all ways to contribute" button */}
            {(tiers.length > 6 || hasOtherWaysToContribute) && (
              <ContainerSectionContent pb={4}>
                <Link href={`/${collective.slug}/contribute`}>
                  <StyledButton mt={3} width={1} buttonSize="small" fontSize="14px">
                    <FormattedMessage id="SectionContribute.All" defaultMessage="All ways to contribute" /> →
                  </StyledButton>
                </Link>
              </ContainerSectionContent>
            )}
          </Fragment>
        )}
      </Fragment>
    );
  }
}

const addEditAccountSettingMutation = graphql(editAccountSettingMutation, {
  name: 'editAccountSettings',
  options: { context: API_V2_CONTEXT },
});

export default addEditAccountSettingMutation(SectionContribute);
