import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { editCollectivePageQuery } from '../lib/graphql/queries';

import CollectiveNavbar from '../components/collective-navbar';
import Delete from '../components/edit-collective/actions/Delete';
import ErrorPage from '../components/ErrorPage';
import { Flex } from '../components/Grid';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';

class EditCollectivePage extends React.Component {
  static getInitialProps({ query, res }) {
    if (res) {
      res.set('Cache-Control', 'no-cache');
    }

    return {
      slug: query.slug,
      scripts: {
        googleMaps: true, // Used in <InputTypeLocation>
      },
    };
  }

  static propTypes = {
    slug: PropTypes.string.isRequired, // for addCollectiveToEditData
    data: PropTypes.object, // from withData
    LoggedInUser: PropTypes.object, // from withLoggedInUser
    loadingLoggedInUser: PropTypes.bool, // from withLoggedInUser
    refetchLoggedInUser: PropTypes.func, // from withUser
  };

  constructor(props) {
    super(props);
    this.state = { Collective: get(props, 'data.Collective') };
  }

  async componentDidMount() {
    this.setState(state => ({
      Collective: get(this.props, 'data.Collective') || state.Collective,
    }));
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.Collective');
    if (currentCollective && get(oldProps, 'data.Collective.id') !== currentCollective.id) {
      this.setState({ Collective: currentCollective });
    }
  }

  render() {
    const { data, LoggedInUser, loadingLoggedInUser } = this.props;
    const collective = get(data, 'Collective') || this.state.Collective;

    if ((data && data.loading) || loadingLoggedInUser) {
      return (
        <Page>
          <Flex justifyContent="center" py={6}>
            <Loading />
          </Flex>
        </Page>
      );
    } else if (data && data.error) {
      return <ErrorPage data={data} />;
    } else if (!LoggedInUser || !collective) {
      return (
        <Page>
          <Flex justifyContent="center" p={5}>
            <MessageBox type="error" withIcon>
              {LoggedInUser ? (
                <FormattedMessage id="editCollective.notFound" defaultMessage="No collective data to edit" />
              ) : (
                <FormattedMessage id="mustBeLoggedIn" defaultMessage="You must be logged in to see this page" />
              )}
            </MessageBox>
          </Flex>
        </Page>
      );
    }

    return (
      <Page>
        <div>
          <CollectiveNavbar collective={collective} isAdmin={false} />
          <div className="content">
            <Delete collective={collective} />
          </div>
        </div>
      </Page>
    );
  }
}

const addDeleteCollectivePageData = graphql(editCollectivePageQuery);

export default withUser(addDeleteCollectivePageData(EditCollectivePage));
