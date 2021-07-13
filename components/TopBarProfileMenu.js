import React from 'react';
import PropTypes from 'prop-types';
import { Query } from '@apollo/client/react/components';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { createGlobalStyle } from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { parseToBoolean } from '../lib/utils';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Link from './Link';
import ListItem from './ListItem';
import LoginBtn from './LoginBtn';
import { withNewsAndUpdates } from './NewsAndUpdatesProvider';
import ProfileMenuMemberships from './ProfileMenuMemberships';
import StyledLink from './StyledLink';
import { P, Span } from './Text';
import { withUser } from './UserProvider';

const CHANGE_LOG_UPDATES_ENABLED = parseToBoolean(process.env.CHANGE_LOG_UPDATES_ENABLED);

const memberInvitationsCountQuery = gqlV2`
  query MemberInvitationsCount($memberAccount: AccountReferenceInput!) {
    memberInvitations(memberAccount: $memberAccount) {
      id
    }
  }
`;

const HideGlobalScroll = createGlobalStyle`
  @media(max-width: 40em) {
    body {
      overflow: hidden;
    }
  }
`;

const UserMenuLinkEntry = props => {
  return (
    <ListItem mb="6px">
      <StyledLink as={Link} fontWeight="500" fontSize="14px" lineHeight="20px" color="black.800" {...props} />
    </ListItem>
  );
};

class TopBarProfileMenu extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    logout: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
    setShowNewsAndUpdates: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyPress);
    document.addEventListener('click', this.onClickOutside);
    if (!getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)) {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutside);
    document.removeEventListener('keydown', this.handleEscKey);
  }

  handleKeyPress = event => {
    const { key, keyCode } = event;
    if (key === 'Escape' || key === 'Esc' || keyCode === 27) {
      this.setState({
        showProfileMenu: false,
      });
    }
  };

  logout = () => {
    this.setState({ showProfileMenu: false, status: 'loggingout' });
    this.props.logout();
    this.setState({ status: 'loggedout' });
  };

  onClickOutside = () => {
    this.setState({ showProfileMenu: false });
  };

  toggleProfileMenu = e => {
    this.setState(state => ({ showProfileMenu: !state.showProfileMenu }));
    // don't propagate to onClickOutside
    e.nativeEvent.stopImmediatePropagation();
  };

  renderProfileMenu() {
    const { LoggedInUser, setShowNewsAndUpdates } = this.props;
    return (
      <Container
        bg="white.full"
        border={['none', '1px solid rgba(18,19,20,0.12)']}
        borderRadius={[0, 12]}
        boxShadow="0 4px 8px 0 rgba(61,82,102,0.08)"
        minWidth="170px"
        maxWidth="500px"
        width="100%"
        position="absolute"
        right={[0, 16]}
        top={[69, 75]}
        zIndex={3000}
        data-cy="user-menu"
        css={{ overflow: 'hidden' }}
      >
        <Flex flexDirection={['column', 'row']} maxHeight={['calc(100vh - 68px)', '100%']}>
          <Box order={[2, 1]} flex="10 1 50%" width={[1, 1, 1 / 2]} p={3} bg="#F7F8FA">
            <Hide xs>
              <Avatar collective={LoggedInUser.collective} radius={56} mr={2} />
              <P mt={2} color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                {LoggedInUser.collective.name}
              </P>
              <P mt="2px" mb={5} wordBreak="break-all" color="black.700" fontSize="13px">
                {LoggedInUser.email}
              </P>
            </Hide>
            <P color="black.900" fontSize="12px" fontWeight="700" letterSpacing="1px" textTransform="uppercase">
              <FormattedMessage id="menu.myAccount" defaultMessage="My account" />
            </P>
            <Box as="ul" p={0} my={2}>
              {CHANGE_LOG_UPDATES_ENABLED && (
                <UserMenuLinkEntry as={Span} onClick={() => setShowNewsAndUpdates(true)}>
                  <FormattedMessage id="menu.newsAndUpdates" defaultMessage="News and Updates" />
                </UserMenuLinkEntry>
              )}
              <UserMenuLinkEntry href={`/${LoggedInUser.username}`}>
                <FormattedMessage id="menu.profile" defaultMessage="Profile" />
              </UserMenuLinkEntry>
              <Query
                query={memberInvitationsCountQuery}
                variables={{ memberAccount: { slug: LoggedInUser.collective.slug } }}
                fetchPolicy="network-only"
                context={API_V2_CONTEXT}
              >
                {({ data, loading }) =>
                  loading === false && data && data.memberInvitations && data.memberInvitations.length > 0 ? (
                    <UserMenuLinkEntry href="/member-invitations">
                      <FormattedMessage
                        id="menu.pendingInvitations"
                        defaultMessage="Pending Invitations ({numberOfInvitations})"
                        values={{ numberOfInvitations: data.memberInvitations.length }}
                      />
                    </UserMenuLinkEntry>
                  ) : null
                }
              </Query>
              <UserMenuLinkEntry href={`/${LoggedInUser.collective.slug}/edit`}>
                <FormattedMessage id="Settings" defaultMessage="Settings" />
              </UserMenuLinkEntry>
              <UserMenuLinkEntry href={`/${LoggedInUser.username}/recurring-contributions`}>
                <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
              </UserMenuLinkEntry>
              <UserMenuLinkEntry href={`/${LoggedInUser.username}/transactions`}>
                <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
              </UserMenuLinkEntry>
              <UserMenuLinkEntry href="/applications">
                <FormattedMessage id="menu.applications" defaultMessage="Applications" />
              </UserMenuLinkEntry>
              <UserMenuLinkEntry as="a" href="https://docs.opencollective.com">
                <FormattedMessage id="menu.help" defaultMessage="Help" />
              </UserMenuLinkEntry>
              <UserMenuLinkEntry as="a" data-cy="logout" onClick={this.logout}>
                <FormattedMessage id="menu.logout" defaultMessage="Log out" /> →
              </UserMenuLinkEntry>
            </Box>
          </Box>
          <Box order={[1, 2]} flex="1 1 50%" width={[1, 1, 1 / 2]} p={3} maxHeight="450px" overflowY="auto">
            <ProfileMenuMemberships user={LoggedInUser} />
          </Box>
        </Flex>
      </Container>
    );
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <Flex alignItems="center" onClick={this.toggleProfileMenu} data-cy="user-menu-trigger">
        <Flex>
          <Avatar collective={get(LoggedInUser, 'collective')} radius="40px" mr={2} />
          <Hide sm md lg>
            <Container mx={-20} my={-1}>
              <ChangelogTrigger height="24px" width="24px" backgroundSize="9.49px 13.5px" />
            </Container>
          </Hide>
        </Flex>
        <Hide xs>
          <ChevronDown color="#4E5052" size="1.5em" cursor="pointer" />
        </Hide>
        {showProfileMenu && (
          <React.Fragment>
            <HideGlobalScroll />
            {this.renderProfileMenu()}
          </React.Fragment>
        )}
      </Flex>
    );
  }

  render() {
    const { loading } = this.state;
    const { LoggedInUser, loadingLoggedInUser } = this.props;

    let status;
    if (this.state.status) {
      status = this.state.status;
    } else if ((loading || loadingLoggedInUser) && typeof LoggedInUser === 'undefined') {
      status = 'loading';
    } else if (!LoggedInUser) {
      status = 'loggedout';
    } else {
      status = 'loggedin';
    }

    return (
      <div className="LoginTopBarProfileButton">
        {status === 'loading' && (
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block">
            <FormattedMessage id="loading" defaultMessage="loading" />
            &hellip;
          </P>
        )}

        {status === 'loggingout' && (
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block">
            <FormattedMessage id="loggingout" defaultMessage="logging out" />
            &hellip;
          </P>
        )}

        {status === 'loggedout' && <LoginBtn />}

        {status === 'loggedin' && this.renderLoggedInUser()}
      </div>
    );
  }
}

export default withNewsAndUpdates(withUser(TopBarProfileMenu));
