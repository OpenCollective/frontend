import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Query } from '@apollo/client/react/components';
import { Exit } from '@styled-icons/boxicons-regular';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ChevronRight } from '@styled-icons/boxicons-regular/ChevronRight';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { createGlobalStyle } from 'styled-components';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';

import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Link from './Link';
import ListItem from './ListItem';
import LoginBtn from './LoginBtn';
import ProfileMenuMemberships from './ProfileMenuMemberships';
import StyledHr from './StyledHr';
import StyledLink from './StyledLink';
import { P } from './Text';
import { withUser } from './UserProvider';

const memberInvitationsCountQuery = gql`
  query MemberInvitationsCount($memberCollectiveId: Int!) {
    memberInvitations(MemberCollectiveId: $memberCollectiveId) {
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
  const { profileMenuLink } = props;
  return (
    <ListItem mb="6px" py={profileMenuLink ? '2' : '0'}>
      <StyledLink as={Link} fontWeight="500" fontSize="14px" lineHeight="20px" color="black.800" {...props} />
    </ListItem>
  );
};
UserMenuLinkEntry.propTypes = {
  profileMenuLink: PropTypes.bool,
};

const MyAccount = props => {
  const { LoggedInUser, logout } = props;

  return (
    <Box as="ul" p={3} my={2}>
      <Query
        query={memberInvitationsCountQuery}
        variables={{ memberCollectiveId: LoggedInUser.CollectiveId }}
        fetchPolicy="network-only"
      >
        {({ data, loading }) =>
          loading === false && data && data.memberInvitations && data.memberInvitations.length > 0 ? (
            <UserMenuLinkEntry profileMenuLink href="/member-invitations">
              <FormattedMessage
                id="menu.pendingInvitations"
                defaultMessage="Pending Invitations ({numberOfInvitations})"
                values={{ numberOfInvitations: data.memberInvitations.length }}
              />
            </UserMenuLinkEntry>
          ) : null
        }
      </Query>
      <UserMenuLinkEntry profileMenuLink href={`/${LoggedInUser.collective.slug}/edit`}>
        <FormattedMessage id="Settings" defaultMessage="Settings" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry profileMenuLink href={`/${LoggedInUser.username}/recurring-contributions`}>
        <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry profileMenuLink href={`/${LoggedInUser.username}/transactions`}>
        <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry profileMenuLink href="/applications">
        <FormattedMessage id="menu.applications" defaultMessage="Applications" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry profileMenuLink as="a" href="https://docs.opencollective.com">
        <FormattedMessage id="menu.help" defaultMessage="Help" />
      </UserMenuLinkEntry>
      <UserMenuLinkEntry profileMenuLink as="a" data-cy="logout" onClick={logout}>
        <Flex alignItems="center">
          <P color="#7A0F2B" fontWeight="500" pr={2} whiteSpace="nowrap">
            <FormattedMessage id="menu.logout" defaultMessage="Log out" />
          </P>
          <Exit size={13} color="#7A0F2B" />
        </Flex>
      </UserMenuLinkEntry>
    </Box>
  );
};
MyAccount.propTypes = {
  LoggedInUser: PropTypes.object,
  logout: PropTypes.func,
};

class TopBarProfileMenu extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    logout: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true, showMyAccount: false };
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
        showMyAccount: false,
      });
    }
  };

  logout = () => {
    this.setState({ showProfileMenu: false, showMyAccount: false, status: 'loggingout' });
    this.props.logout();
    this.setState({ status: 'loggedout' });
  };

  onClickOutside = () => {
    this.setState({ showProfileMenu: false, showMyAccount: false });
  };

  toggleProfileMenu = e => {
    this.setState(state => ({ showProfileMenu: !state.showProfileMenu, showMyAccount: false }));
    // don't propagate to onClickOutside
    e.nativeEvent.stopImmediatePropagation();
  };

  showAccountInfo = e => {
    this.setState({ showMyAccount: true });
    e.stopPropagation();
  };

  hideAccountInfo = e => {
    this.setState({ showMyAccount: false });
    e.stopPropagation();
  };

  renderProfileMenu() {
    const { LoggedInUser } = this.props;
    const { showMyAccount } = this.state;
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
          <Hide lg md sm>
            <Box p={3} pb={1} onClick={this.showAccountInfo}>
              <Flex alignItems="center">
                {showMyAccount ? (
                  <P
                    color="black.700"
                    fontSize="12px"
                    fontWeight="500"
                    letterSpacing="0.06em"
                    pr={2}
                    textTransform="uppercase"
                    whiteSpace="nowrap"
                    onClick={this.hideAccountInfo}
                  >
                    ← <FormattedMessage id="go-back" defaultMessage="Back" />
                  </P>
                ) : (
                  <React.Fragment>
                    <P
                      color="black.700"
                      fontSize="12px"
                      fontWeight="500"
                      letterSpacing="0.06em"
                      pr={2}
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                    >
                      <FormattedMessage id="account" defaultMessage="My Account" />
                    </P>
                    <StyledHr flex="1" borderStyle="solid" borderColor="#DCDEE0" />
                  </React.Fragment>
                )}
              </Flex>
              <Flex py={3} pb={2} alignItems="center" justifyContent="space-between">
                <Flex>
                  <Avatar collective={LoggedInUser.collective} radius={56} mr={2} />
                  <Box>
                    <P mt={2} color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                      {LoggedInUser.collective.name}
                    </P>
                    <P mt="2px" mb={1} wordBreak="break-all" color="black.700" fontSize="13px">
                      {LoggedInUser.email}
                    </P>
                  </Box>
                </Flex>
                {!showMyAccount ? <ChevronRight size={12} color="#76777A" /> : ''}
              </Flex>
            </Box>
          </Hide>

          {!showMyAccount ? (
            <React.Fragment>
              <Box order={[2, 1]} flex="10 1 50%" width={[1, 1, 1 / 2]} p={3} bg="#F7F8FA">
                <Hide xs>
                  <Avatar collective={LoggedInUser.collective} radius={56} mr={2} />
                  <P mt={2} color="black.800" fontWeight="500" fontSize="14px" lineHeight="20px">
                    {LoggedInUser.collective.name}
                  </P>
                  <P mt="2px" mb={5} wordBreak="break-all" color="black.700" fontSize="13px">
                    {LoggedInUser.email}
                  </P>
                  <Box as="ul" p={0} my={2}>
                    <Query
                      query={memberInvitationsCountQuery}
                      variables={{ memberCollectiveId: LoggedInUser.CollectiveId }}
                      fetchPolicy="network-only"
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
                </Hide>
              </Box>
              <Box order={[1, 2]} flex="1 1 50%" width={[1, 1, 1 / 2]} p={3} maxHeight="450px" overflowY="auto">
                <ProfileMenuMemberships user={LoggedInUser} />
              </Box>
            </React.Fragment>
          ) : (
            <MyAccount LoggedInUser={LoggedInUser} logout={this.logout} />
          )}
        </Flex>
      </Container>
    );
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <Flex alignItems="center" onClick={this.toggleProfileMenu} data-cy="user-menu-trigger">
        <Hide xs sm>
          <P
            color="black.700"
            display="inline-block"
            fontSize="13px"
            lineHeight="16px"
            fontWeight="500"
            letterSpacing="1px"
            mx={2}
            cursor="pointer"
            data-cy="topbar-login-username"
          >
            {LoggedInUser.collective.name || LoggedInUser.username}
          </P>
        </Hide>
        <Avatar collective={get(LoggedInUser, 'collective')} radius="40px" mr={2} />
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

export default withUser(TopBarProfileMenu);
