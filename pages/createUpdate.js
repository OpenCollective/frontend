import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { ArrowBack } from '@styled-icons/boxicons-regular';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { addCollectiveNavbarData } from '../lib/graphql/queries';
import { compose } from '../lib/utils';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import Container from '../components/Container';
import EditUpdateForm from '../components/EditUpdateForm';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import StyledButtonSet from '../components/StyledButtonSet';
import { H1 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const BackButtonWrapper = styled(Container)`
  position: relative;
  color: #71757a;
  margin-right: 62px;
  margin-left: 20px;
  @media (max-width: 600px) {
    margin-left: 0;
  }
`;

const CreateUpdateWrapper = styled(Flex)`
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const UPDATE_TYPE_MSGS = defineMessages({
  normal: {
    id: 'update.type.normal',
    defaultMessage: 'Normal Update',
  },
  changelog: { id: 'update.type.changelog', defaultMessage: 'Changelog Entry' },
});
const UPDATE_TYPES = Object.keys(UPDATE_TYPE_MSGS);

class CreateUpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveNavbarData
    action: PropTypes.string, // not used atm, not clear where it's coming from, not in the route
    createUpdate: PropTypes.func, // from addMutation/createUpdateQuery
    data: PropTypes.shape({
      account: PropTypes.object,
    }).isRequired, // from withData
    LoggedInUser: PropTypes.object,
    router: PropTypes.object,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      update: {},
      status: '',
      error: '',
      updateType: props.data?.account?.slug === 'opencollective' ? UPDATE_TYPES[1] : UPDATE_TYPES[0],
    };
  }

  createUpdate = async update => {
    const { data } = this.props;
    const { account } = data;

    this.setState({ error: '', status: 'submitting' });

    try {
      update.account = { id: account.id };
      update.isChangelog = this.isChangelog();
      if (update.isChangelog) {
        update.isPrivate = false;
      }
      const res = await this.props.createUpdate({ variables: { update } });
      this.setState({ isModified: false });
      return this.props.router.push(`/${account.slug}/updates/${res.data.createUpdate.slug}`);
    } catch (e) {
      this.setState({ status: 'error', error: e.message });
    }
  };

  handleChange = (attr, value) => {
    const update = this.state.update;
    update[attr] = value;
    this.setState({ update, isModified: true });
  };

  isChangelog = () => {
    return this.state.updateType === UPDATE_TYPES[1];
  };

  render() {
    const { data, LoggedInUser, intl } = this.props;

    if (!data.account) {
      return <ErrorPage data={data} />;
    }

    const collective = data.account;
    const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <div>
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar collective={collective} isAdmin={isAdmin} />
          <CreateUpdateWrapper className="content" mt={4} alignItems="baseline">
            <BackButtonWrapper>
              <Link href={`/${collective.slug}/updates`}>
                <Container display="flex" color="#71757A" fontSize="14px" alignItems="center">
                  <ArrowBack size={18} />
                  <Box as="span" mx={2}>
                    Back
                  </Box>
                </Container>
              </Link>
            </BackButtonWrapper>
            <Container width={1} maxWidth={680}>
              {!isAdmin && (
                <div className="login">
                  <p>
                    <FormattedMessage
                      id="updates.create.login"
                      defaultMessage="You need to be logged in as a core contributor of this collective to be able to create an update."
                    />
                  </p>
                  <p>
                    <StyledButton buttonStyle="primary" href={`/signin?next=/${collective.slug}/updates/new`}>
                      <FormattedMessage id="signIn" defaultMessage="Sign In" />
                    </StyledButton>
                  </p>
                </div>
              )}
              {isAdmin && (
                <Container my={3}>
                  <H1 textAlign="left" fontSize="34px">
                    <FormattedMessage id="updates.new.title" defaultMessage="New update" />
                  </H1>
                </Container>
              )}
              {collective.slug === 'opencollective' && LoggedInUser && (
                <StyledButtonSet
                  size="medium"
                  items={UPDATE_TYPES}
                  selected={this.state.updateType}
                  onChange={value => this.setState({ updateType: value })}
                >
                  {({ item }) => intl.formatMessage(UPDATE_TYPE_MSGS[item])}
                </StyledButtonSet>
              )}
              {isAdmin && (
                <EditUpdateForm collective={collective} onSubmit={this.createUpdate} isChangelog={this.isChangelog()} />
              )}
              {this.state.status === 'error' && (
                <MessageBox type="error" withIcon>
                  <FormattedMessage
                    id="updates.new.error"
                    defaultMessage="Update failed: {err}"
                    values={{ err: this.state.error }}
                  />
                </MessageBox>
              )}
            </Container>
          </CreateUpdateWrapper>
        </Body>
        <Footer />
      </div>
    );
  }
}

const createUpdateMutation = gqlV2/* GraphQL */ `
  mutation CreateUpdate($update: UpdateCreateInput!) {
    createUpdate(update: $update) {
      id
      slug
      title
      summary
      html
      createdAt
      publishedAt
      updatedAt
      tags
      isPrivate
      isChangelog
      makePublicOn
      account {
        id
        slug
      }
      fromAccount {
        id
        type
        name
        slug
      }
    }
  }
`;

const addCreateUpdateMutation = graphql(createUpdateMutation, {
  name: 'createUpdate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addGraphql = compose(addCollectiveNavbarData, addCreateUpdateMutation);

export default withUser(addGraphql(withRouter(injectIntl(CreateUpdatePage))));
