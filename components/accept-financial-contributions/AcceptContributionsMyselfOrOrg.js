import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { PlusCircle } from '@styled-icons/boxicons-regular/PlusCircle';
import { Form, Formik } from 'formik';
import { compose, uniqBy } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { BANK_TRANSFER_DEFAULT_INSTRUCTIONS } from '../../lib/constants/payout-method';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import Avatar from '../Avatar';
import { collectivePageQuery } from '../collective-page/graphql/queries';
import CollectiveNavbar from '../CollectiveNavbar';
import Container from '../Container';
import CreateCollectiveMiniForm from '../CreateCollectiveMiniForm';
import PayoutBankInformationForm from '../expenses/PayoutBankInformationForm';
import FinancialContributionsFAQ from '../faqs/FinancialContributionsFAQ';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { H1, H2, P } from '../Text';
import { withUser } from '../UserProvider';

import StripeOrBankAccountPicker from './StripeOrBankAccountPicker';

import acceptOrganizationIllustration from '../../public/static/images/create-collective/acceptContributionsOrganizationHoverIllustration.png';

const { TW_API_COLLECTIVE_SLUG } = process.env;

const CreateNewOrg = styled(Flex)`
  border: 1px solid lightgray;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
`;

const OrgCard = styled(Flex)`
  cursor: pointer;
  border-radius: 10px;
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

class AcceptContributionsMyselfOrOrg extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    router: PropTypes.object,
    LoggedInUser: PropTypes.object.isRequired,
    editBankAccount: PropTypes.func,
    refetchLoggedInUser: PropTypes.func,
    createPayoutMethod: PropTypes.func,
    applyToHost: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: null,
      miniForm: false,
      organization: null,
    };
  }

  // GraphQL functions
  addHost = async (collective, host) => {
    const collectiveInput = {
      slug: collective.slug,
    };
    const hostInput = {
      slug: host.slug,
    };
    try {
      await this.props.applyToHost({
        variables: {
          collective: collectiveInput,
          host: hostInput,
        },
        refetchQueries: [{ query: collectivePageQuery, variables: { slug: this.props.collective.slug } }],
        awaitRefetchQueries: true,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      throw new Error(errorMsg);
    }
  };

  submitBankAccountInformation = async payoutMethodData => {
    // prepare objects
    const account = {
      legacyId: this.state.organization ? this.state.organization.id : this.props.LoggedInUser.CollectiveId,
    };

    // try mutation
    try {
      await this.props.createPayoutMethod({
        variables: {
          payoutMethod: { data: { ...payoutMethodData, isManualBankTransfer: true }, type: 'BANK_ACCOUNT' },
          account,
        },
      });
      await this.props.editBankAccount({
        variables: {
          account,
          key: 'paymentMethods',
          value: {
            manual: {
              title: 'Bank transfer',
              features: {
                recurring: false,
              },
              instructions: BANK_TRANSFER_DEFAULT_INSTRUCTIONS,
            },
          },
        },
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      throw new Error(errorMsg);
    }
  };

  render() {
    const { collective, router, LoggedInUser } = this.props;
    const { error, miniForm, organization, loading } = this.state;

    // Get and filter orgs LoggedInUser is part of
    const memberships = uniqBy(
      LoggedInUser.memberOf.filter(m => m.role === 'ADMIN'),
      m => m.collective.id,
    );

    const orgs = memberships
      .filter(m => m.collective.type === 'ORGANIZATION')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    // Form values and submit
    const initialValues = {
      data: {},
    };

    const submit = async values => {
      try {
        this.setState({ loading: true });
        const { data } = values;
        await this.submitBankAccountInformation(data);
        await this.addHost(collective, organization ? organization : LoggedInUser.collective);
        await this.props.refetchLoggedInUser();
        await Router.pushRoute('accept-financial-contributions', {
          slug: this.props.collective.slug,
          path: this.props.router.query.path,
          state: 'success',
        });
        window.scrollTo(0, 0);
      } catch (e) {
        this.setState({ loading: false });
        this.setState({ error: e });
      }
    };

    const host = organization ? organization : LoggedInUser.collective;
    // Conditional rendering
    const noOrganizationPicked = router.query.path === 'organization' && !organization;
    const organizationPicked = router.query.path === 'organization' && organization;
    const ableToChooseStripeOrBankAccount =
      (organizationPicked && !router.query.method) || (router.query.path === 'myself' && !router.query.method);

    return (
      <Fragment>
        <CollectiveNavbar collective={collective} onlyInfos={true} />
        <Box mb={2} mt={5} mx={[2, 6]}>
          <H1
            fontSize={['20px', '32px']}
            lineHeight={['24px', '36px']}
            fontWeight="bold"
            color="black.900"
            textAlign="center"
          >
            <FormattedMessage id="acceptContributions.picker.header" defaultMessage="Accept financial contributions" />
          </H1>
        </Box>
        <Container display="flex" flexDirection="column" alignItems="center">
          <Flex flexDirection="column" alignItems="center" maxWidth={'575px'} my={2} mx={[3, 0]}>
            {noOrganizationPicked ? (
              <Fragment>
                <Image src={acceptOrganizationIllustration} alt="" />
                <H2 fontSize="20px" fontWeight="bold" color="black.900" textAlign="center">
                  <FormattedMessage id="acceptContributions.organization.subtitle" defaultMessage="Our organization" />
                </H2>
              </Fragment>
            ) : (
              <Fragment>
                <Avatar collective={organizationPicked ? organization : LoggedInUser.collective} radius={64} mb={2} />
                <P fontSize="16px" lineHeight="21px" fontWeight="bold" mb={3}>
                  {organizationPicked ? organization.name : LoggedInUser.collective.name}
                </P>
                <H2 fontSize="20px" fontWeight="bold" color="black.900" textAlign="center">
                  {router.query.method === 'bank' ? (
                    <FormattedMessage id="acceptContributions.addBankAccount" defaultMessage="Add bank account" />
                  ) : (
                    <FormattedMessage
                      id="acceptContributions.howAreYouAcceptingContributions"
                      defaultMessage="How are you accepting contributions?"
                    />
                  )}
                </H2>
              </Fragment>
            )}
          </Flex>
          {noOrganizationPicked && (
            <Flex flexDirection="column" justifyContent="center" alignItems="center" my={3} minWidth={'450px'}>
              <Flex px={3} width="100%">
                <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
                  <FormattedMessage id="acceptContributions.organization.myOrgs" defaultMessage="My organizations" />
                </P>
                <Flex flexGrow={1} alignItems="center">
                  <StyledHr width="100%" ml={2} />
                </Flex>
              </Flex>
              {orgs.length > 0 && (
                <Flex px={3} width="100%" flexDirection="column">
                  {orgs.map(org => (
                    <OrgCard
                      alignItems="center"
                      key={org.collective.id}
                      my={2}
                      onClick={() => this.setState({ organization: org.collective })}
                      data-cy="afc-organization-org-card"
                    >
                      <Avatar radius={56} collective={org.collective} />
                      <Flex flexDirection="column" ml={3}>
                        <P color="black.900" mb={1}>
                          {org.collective.name}
                        </P>
                        <P color="black.600">@{org.collective.slug}</P>
                      </Flex>
                    </OrgCard>
                  ))}
                </Flex>
              )}
              <Flex px={3} width="100%">
                <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
                  <FormattedMessage id="CollectivePicker.CreateNew" defaultMessage="Create new" />
                </P>
                <Flex flexGrow={1} alignItems="center">
                  <StyledHr width="100%" ml={2} />
                </Flex>
              </Flex>

              <Flex my={2} px={3} flexDirection="column" width="100%">
                {miniForm ? (
                  <CreateCollectiveMiniForm
                    type="ORGANIZATION"
                    onCancel={() => this.setState({ miniForm: false })}
                    onSuccess={data => this.setState({ organization: data })}
                    LoggedInUser={LoggedInUser}
                    addLoggedInUserAsAdmin
                    excludeAdminFields
                  />
                ) : (
                  <CreateNewOrg
                    alignItems="center"
                    onClick={() => this.setState({ miniForm: true })}
                    data-cy="afc-organization-create-new"
                  >
                    <PlusCircle size="24" color="gray" />
                    <P fontSize="12px" color="black.800" ml={2}>
                      <FormattedMessage id="Organization.CreateNew" defaultMessage="Create new Organization" />
                    </P>
                  </CreateNewOrg>
                )}
              </Flex>
            </Flex>
          )}
          {router.query.method === 'bank' && (
            <Flex flexDirection={['column', 'row']} justifyContent={'space-evenly'} mx={[2, 4]} my={3}>
              <Box width={1 / 5} display={['none', null, 'block']}></Box>
              <Flex width={[1, 1 / 2]} flexDirection="column" justifyContent="center" alignItems="center" px={3}>
                <Box alignItems="center">
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontWeight="bold" fontSize="14px">
                    <FormattedMessage id="paymentMethods.manual.HowDoesItWork" defaultMessage="How does it work?" />
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontSize="14px">
                    <FormattedMessage
                      id="acceptContributions.HowDoesItWork.details"
                      defaultMessage="Financial contributors will be able to choose 'Bank transfer' as a payment method. Instructions to make the transfer, which you define, will be emailed to them, along with a unique order ID. Once you receive the money, you can mark the corresponding pending order as paid and the funds will be credited to the Collective's balance."
                    />
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontWeight="bold" fontSize="14px">
                    <FormattedMessage
                      id="acceptContributions.definePaymentInstructions"
                      defaultMessage="Define payment instructions"
                    />
                  </P>
                  <P color="black.900" textAlign="left" mt={[2, 3]} fontSize="14px">
                    <FormattedMessage
                      id="acceptContributions.definePaymentInstructionsDetails"
                      defaultMessage="Include any details contributors will need to send you money, such as: account name and number; IBAN, Swift, or routing codes; bank name and address, etc. The amount and order ID will be automatically included."
                    />
                  </P>
                  <Formik initialValues={initialValues} onSubmit={submit}>
                    {formik => {
                      const { handleSubmit } = formik;

                      return (
                        <Form>
                          <Box width={['100%', '75%']}>
                            <PayoutBankInformationForm
                              host={{ slug: TW_API_COLLECTIVE_SLUG }}
                              getFieldName={string => string}
                              // Fix currency if it was already linked to Stripe
                              fixedCurrency={
                                host.connectedAccounts?.find?.(ca => ca.service === 'stripe') && host.currency
                              }
                              isNew
                            />
                          </Box>

                          {error && (
                            <Flex>
                              <MessageBox type="error" flexGrow={1} withIcon mt={3}>
                                {error.message}
                              </MessageBox>
                            </Flex>
                          )}

                          <Flex justifyContent={'center'} mt={3}>
                            <StyledButton
                              fontSize="13px"
                              minWidth={'85px'}
                              minHeight="36px"
                              type="button"
                              onClick={() => {
                                Router.pushRoute('accept-financial-contributions', {
                                  slug: this.props.collective.slug,
                                  path: this.props.router.query.path,
                                }).then(() => window.scrollTo(0, 0));
                              }}
                            >
                              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                            </StyledButton>
                            <StyledButton
                              fontSize="13px"
                              minWidth={'85px'}
                              minHeight="36px"
                              ml={2}
                              buttonStyle="dark"
                              type="submit"
                              loading={loading}
                              onSubmit={handleSubmit}
                              data-cy="afc-add-bank-info-submit"
                            >
                              <FormattedMessage id="save" defaultMessage="Save" />
                            </StyledButton>
                          </Flex>
                        </Form>
                      );
                    }}
                  </Formik>
                </Box>
              </Flex>
              <Flex justifyContent="center" width={[1, 1 / 3, 1 / 5]} my={[3, 0]}>
                <FinancialContributionsFAQ width={['90%', '100%']} />
              </Flex>
            </Flex>
          )}
          {ableToChooseStripeOrBankAccount && (
            <StripeOrBankAccountPicker collective={collective} host={host} addHost={this.addHost} />
          )}
        </Container>
      </Fragment>
    );
  }
}

const createPayoutMethodMutation = gqlV2/* GraphQL */ `
  mutation CreatePayoutMethod($payoutMethod: PayoutMethodInput!, $account: AccountReferenceInput!) {
    createPayoutMethod(payoutMethod: $payoutMethod, account: $account) {
      data
      id
      name
      type
    }
  }
`;

const addCreatePayoutMethodMutation = graphql(createPayoutMethodMutation, {
  name: 'createPayoutMethod',
  options: { context: API_V2_CONTEXT },
});

const editBankAccountMutation = gqlV2/* GraphQL */ `
  mutation EditBankAccount($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const addEditBankAccountMutation = graphql(editBankAccountMutation, {
  name: 'editBankAccount',
  options: { context: API_V2_CONTEXT },
});

const applyToHostMutation = gqlV2/* GraphQL */ `
  mutation ApplyToHost($collective: AccountReferenceInput!, $host: AccountReferenceInput!) {
    applyToHost(collective: $collective, host: $host) {
      id
      slug
      host {
        id
        slug
      }
    }
  }
`;

const addApplyToHostMutation = graphql(applyToHostMutation, {
  name: 'applyToHost',
  options: { context: API_V2_CONTEXT },
});

const inject = compose(
  withUser,
  withRouter,
  addApplyToHostMutation,
  addEditBankAccountMutation,
  addCreatePayoutMethodMutation,
);

export default inject(AcceptContributionsMyselfOrOrg);
