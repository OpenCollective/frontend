import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import { isEqual } from 'lodash';
import Router from 'next/router';

import { LOCAL_STORAGE_KEYS, removeFromLocalStorage } from '../lib/local-storage';
import UserClass from '../lib/LoggedInUser';
import withLoggedInUser from '../lib/withLoggedInUser';

export const UserContext = React.createContext({
  loadingLoggedInUser: true,
  errorLoggedInUser: null,
  LoggedInUser: null,
  logout() {},
  login() {},
  refetchLoggedInUser() {},
});

class UserProvider extends React.Component {
  static propTypes = {
    getLoggedInUser: PropTypes.func.isRequired,
    token: PropTypes.string,
    client: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    children: PropTypes.node,
    /**
     * If not used inside of NextJS (ie. in styleguide), the code that checks if we are
     * on `/signin` that uses `Router` will crash. Setting this prop bypass this behavior.
     */
    skipRouteCheck: PropTypes.bool,
  };

  state = {
    loadingLoggedInUser: true,
    LoggedInUser: null,
    errorLoggedInUser: null,
    enforceTwoFactorAuthForLoggedInUser: null,
  };

  async componentDidMount() {
    window.addEventListener('storage', this.checkLogin);

    // Disable auto-login on SignIn page
    if (this.props.skipRouteCheck || Router.pathname !== '/signin') {
      await this.login();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('storage', this.checkLogin);
  }

  checkLogin = event => {
    if (event.key === 'LoggedInUser') {
      if (event.oldValue && !event.newValue) {
        return this.setState({ LoggedInUser: null });
      }
      if (!event.oldValue && event.newValue) {
        const { value } = JSON.parse(event.newValue);
        return this.setState({ LoggedInUser: new UserClass(value) });
      }

      const { value: oldValue } = JSON.parse(event.oldValue);
      const { value } = JSON.parse(event.newValue);

      if (!isEqual(oldValue, value)) {
        this.setState({ LoggedInUser: new UserClass(value) });
      }
    }
  };

  logout = async () => {
    removeFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    this.props.client.resetStore();
    this.setState({ LoggedInUser: null, errorLoggedInUser: null });
  };

  login = async (token, options = {}) => {
    const { getLoggedInUser } = this.props;
    const { twoFactorAuthenticatorCode, recoveryCode } = options;
    try {
      const LoggedInUser = token
        ? await getLoggedInUser({ token, twoFactorAuthenticatorCode, recoveryCode })
        : await getLoggedInUser();
      this.setState({
        loadingLoggedInUser: false,
        errorLoggedInUser: null,
        LoggedInUser,
        enforceTwoFactorAuthForLoggedInUser: false,
      });
      return LoggedInUser;
    } catch (error) {
      // If token from localStorage is invalid or expired, delete it
      if (!token && ['Invalid token', 'Expired token'].includes(error.message)) {
        this.logout();
      }

      // Store the error
      this.setState({ loadingLoggedInUser: false, errorLoggedInUser: error.message });
      if (error.message.includes('Two-factor authentication is enabled')) {
        this.setState({ enforceTwoFactorAuthForLoggedInUser: true });
        throw new Error(error.message);
      }
      if (error.type === 'too_many_requests') {
        this.setState({ enforceTwoFactorAuthForLoggedInUser: false });
        throw new Error(error.message);
      }
      // We don't want to catch "Two-factor authentication code failed. Please try again" here
      if (error.type === 'unauthorized' && error.message.includes('Cannot use this token')) {
        this.setState({ enforceTwoFactorAuthForLoggedInUser: false });
        throw new Error(error.message);
      }
    }
  };

  /**
   * Same as `login` but skip loading the user from localStorage cache. Note
   * that Apollo keeps a local cache too, so you should first use
   * [refetchQueries](https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-mutation-options-refetchQueries)
   * if you really need to be up-to-date with server.
   */
  refetchLoggedInUser = async () => {
    const { getLoggedInUser } = this.props;
    try {
      const LoggedInUser = await getLoggedInUser();
      this.setState({
        errorLoggedInUser: null,
        loadingLoggedInUser: false,
        LoggedInUser,
      });
    } catch (error) {
      this.setState({ loadingLoggedInUser: false, errorLoggedInUser: error });
    }
    return true;
  };

  render() {
    return (
      <UserContext.Provider
        value={{ ...this.state, logout: this.logout, login: this.login, refetchLoggedInUser: this.refetchLoggedInUser }}
      >
        {this.props.children}
      </UserContext.Provider>
    );
  }
}

const { Consumer: UserConsumer } = UserContext;

const withUser = WrappedComponent => {
  const WithUser = props => <UserConsumer>{context => <WrappedComponent {...context} {...props} />}</UserConsumer>;

  WithUser.getInitialProps = async context => {
    return WrappedComponent.getInitialProps ? await WrappedComponent.getInitialProps(context) : {};
  };

  return WithUser;
};

const useUser = () => React.useContext(UserContext);

export default withApollo(withLoggedInUser(UserProvider));

export { UserConsumer, withUser, useUser };
