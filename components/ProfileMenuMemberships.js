import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Plus } from '@styled-icons/boxicons-regular';
import { Settings } from '@styled-icons/feather/Settings';
import { groupBy, isEmpty, uniqBy } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';
import { isPastEvent } from '../lib/events';

import Avatar from './Avatar';
import { Box, Flex } from './Grid';
import Image from './Image';
import Link from './Link';
import ListItem from './ListItem';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';
import StyledLink from './StyledLink';
import StyledRoundButton from './StyledRoundButton';
import { P } from './Text';

const messages = defineMessages({
  settings: {
    id: 'Settings',
    defaultMessage: 'Settings',
  },
});

const CollectiveListItem = styled(ListItem)`
  @media (hover: hover) {
    :hover svg {
      opacity: 1;
    }
  }
  @media (hover: none) {
    svg {
      opacity: 1;
    }
  }
`;

const MembershipLine = ({ user, membership }) => {
  const intl = useIntl();
  return (
    <CollectiveListItem py={1} display="flex" justifyContent="space-between" alignItems="center">
      <Link href={`/${membership.collective.slug}`} title={membership.collective.name}>
        <Flex alignItems="center">
          <Avatar collective={membership.collective} radius="32px" mr="12px" />
          <Flex flexDirection="column" maxWidth="150px">
            <P fontSize="14px" fontWeight="500" lineHeight="20px" color="black.800" truncateOverflow>
              {membership.collective.name}
            </P>
            <P fontSize="12px" lineHeight="18px" truncateOverflow color="black.700">
              @{membership.collective.slug}
            </P>
          </Flex>
        </Flex>
      </Link>
      {Boolean(user?.canEditCollective(membership.collective)) && (
        <StyledLink
          as={Link}
          href={`/${membership.collective.slug}/edit`}
          ml={1}
          color="black.500"
          title={intl.formatMessage(messages.settings)}
        >
          <Settings opacity="0" size="1.2em" />
        </StyledLink>
      )}
    </CollectiveListItem>
  );
};

MembershipLine.propTypes = {
  user: PropTypes.object,
  membership: PropTypes.object,
};

const sortMemberships = memberships => {
  if (!memberships?.length) {
    return [];
  } else {
    return memberships.sort((a, b) => {
      return a.collective.slug.localeCompare(b.collective.slug);
    });
  }
};

const filterMemberships = memberships => {
  const filteredMemberships = memberships.filter(m => {
    if (m.role === 'BACKER') {
      return false;
    } else if (m.collective.type === 'EVENT' && isPastEvent(m.collective)) {
      return false;
    } else {
      return Boolean(m.collective);
    }
  });

  return uniqBy(filteredMemberships, m => m.collective.id);
};

const MembershipsList = ({ user, memberships }) => {
  return (
    <Box as="ul" p={0} my={2}>
      {sortMemberships(memberships).map(member => (
        <MembershipLine key={member.id} membership={member} user={user} />
      ))}
    </Box>
  );
};

MembershipsList.propTypes = {
  user: PropTypes.object,
  memberships: PropTypes.array,
};

const EmptyMemberships = () => {
  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%">
      <Image src="/static/images/empty-user-menu.png" width={216} height={146} />
      <P color="blue.900" fontSize="20px" lineHeight="28px" fontWeight="700" mt={30} textAlign="center">
        <FormattedMessage id="ProfileMenuMemberships.Empty" defaultMessage="Make the most out of Open Collective" />
      </P>
      <Box mt={30}>
        <Link href="/create">
          <StyledButton buttonStyle="primary" buttonSize="tiny" width="100%">
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </StyledButton>
        </Link>
        <Link href="/discover">
          <StyledButton buttonSize="tiny" width="100%" mt={3}>
            <FormattedMessage id="home.discoverCollectives" defaultMessage="Discover Collectives" />
          </StyledButton>
        </Link>
      </Box>
    </Flex>
  );
};

const ProfileMenuMemberships = ({ user }) => {
  const memberships = filterMemberships(user.memberOf);
  if (isEmpty(memberships)) {
    return <EmptyMemberships />;
  }

  const groupedMemberships = groupBy(memberships, m => m.collective.type);
  return (
    <React.Fragment>
      <Flex alignItems="center">
        <P
          color="black.700"
          fontSize="12px"
          fontWeight="500"
          letterSpacing="0.06em"
          pr={2}
          textTransform="uppercase"
          whiteSpace="nowrap"
        >
          <FormattedMessage id="collective" defaultMessage="My Collectives" />
        </P>
        <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
        <Link href="/create">
          <StyledRoundButton ml={2} size={24} color="#C4C7CC">
            <Plus size={12} color="#76777A" />
          </StyledRoundButton>
        </Link>
      </Flex>
      <MembershipsList memberships={groupedMemberships[CollectiveType.COLLECTIVE]} user={user} />
      {isEmpty(groupedMemberships[CollectiveType.COLLECTIVE]) && (
        <Box my={2}>
          <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
            <em>
              <FormattedMessage id="menu.collective.none" defaultMessage="No Collectives yet" />
            </em>
          </P>
        </Box>
      )}
      {!isEmpty(groupedMemberships[CollectiveType.EVENT]) && (
        <div>
          <Flex alignItems="center" mt={3}>
            <P
              color="#4E5052"
              fontFamily="montserratlight, arial"
              fontSize="1rem"
              fontWeight="600"
              letterSpacing="1px"
              pr={2}
              textTransform="uppercase"
              whiteSpace="nowrap"
            >
              <FormattedMessage id="events" defaultMessage="My Events" />
            </P>
            <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
          </Flex>
          <MembershipsList memberships={groupedMemberships[CollectiveType.EVENT]} user={user} />
        </div>
      )}
      {!isEmpty(groupedMemberships[CollectiveType.FUND]) && (
        <Fragment>
          <Flex alignItems="center" mt={3}>
            <P
              color="#4E5052"
              fontFamily="montserratlight, arial"
              fontSize="1rem"
              fontWeight="600"
              letterSpacing="1px"
              pr={2}
              textTransform="uppercase"
              whiteSpace="nowrap"
            >
              <FormattedMessage id="funds" defaultMessage="My Funds" />
            </P>
            <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
            <StyledRoundButton ml={2} size={24} color="#C4C7CC">
              <Link href="/fund/create">
                <Plus size={12} color="#76777A" />
              </Link>
            </StyledRoundButton>
          </Flex>
          <MembershipsList memberships={groupedMemberships[CollectiveType.FUND]} user={user} />
        </Fragment>
      )}
      <Flex alignItems="center" mt={3}>
        <P
          color="black.700"
          fontSize="12px"
          fontWeight="500"
          letterSpacing="0.06em"
          pr={2}
          textTransform="uppercase"
          whiteSpace="nowrap"
        >
          <FormattedMessage id="organization" defaultMessage="My Organizations" />
        </P>
        <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
        <Link href="/organizations/new">
          <StyledRoundButton ml={2} size={24} color="#C4C7CC">
            <Plus size={12} color="#76777A" />
          </StyledRoundButton>
        </Link>
      </Flex>
      <MembershipsList memberships={groupedMemberships[CollectiveType.ORGANIZATION]} user={user} />
      {isEmpty(groupedMemberships[CollectiveType.ORGANIZATION]) && (
        <Box my={2}>
          <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
            <em>
              <FormattedMessage id="menu.organizations.none" defaultMessage="No Organizations yet" />
            </em>
          </P>
        </Box>
      )}
    </React.Fragment>
  );
};

ProfileMenuMemberships.propTypes = {
  user: PropTypes.shape({
    memberOf: PropTypes.arrayOf(PropTypes.object),
  }),
};

export default React.memo(ProfileMenuMemberships);
