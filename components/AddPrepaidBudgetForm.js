import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { withApollo } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency, getCurrencySymbol } from '../lib/currency-utils';

import { AddFundsSourcePickerForUserWithData } from './AddFundsSourcePicker';
import Container from './Container';
import { Box, Flex } from './Grid';
import InputField from './InputField';
import StyledButton from './StyledButton';
import { H2, Strong } from './Text';

const addPrepaidBudgetHostFeePercentQuery = gql`
  query AddPrepaidBudgetHostFeePercent($CollectiveId: Int) {
    Collective(id: $CollectiveId) {
      id
      hostFeePercent
    }
  }
`;

const TableContainer = styled.table`
  margin: 0.5rem 0 1rem 0;
  width: 100%;

  hr {
    margin: 0.5rem 0;
    color: black;
  }

  td.amount {
    text-align: right;
  }
`;

class AddPrepaidBudgetForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    host: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    intl: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object,
    client: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      form: {
        totalAmount: 0,
        hostFeePercent: get(props, 'collective.hostFeePercent'),
      },
      result: {},
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.messages = defineMessages({
      'api.error.unreachable': {
        id: 'api.error.unreachable',
        defaultMessage: "Can't reach the API. Please try again in a few minutes.",
      },
      'totalAmount.label': {
        id: 'Fields.amount',
        defaultMessage: 'Amount',
      },
      'description.label': {
        id: 'Fields.description',
        defaultMessage: 'Description',
      },
      'FromCollectiveId.label': {
        id: 'addfunds.FromCollectiveId.label',
        defaultMessage: 'source',
      },
      'FromCollectiveId.addfundstoorg.label': {
        id: 'Member.Role.HOST',
        defaultMessage: 'Host',
      },
      'hostFeePercent.label': {
        id: 'HostFee',
        defaultMessage: 'Host fee',
      },
      'name.label': { id: 'Fields.name', defaultMessage: 'Name' },
      'email.label': { id: 'Email', defaultMessage: 'Email' },
      'organization.label': {
        id: 'addfunds.organization.label',
        defaultMessage: 'organization',
      },
      'website.label': { id: 'Fields.website', defaultMessage: 'Website' },
    });

    this.totalAmountField = {
      name: 'totalAmount',
      type: 'currency',
      focus: true,
      pre: getCurrencySymbol(props.collective.currency),
    };

    this.fields = [
      this.totalAmountField,
      {
        name: 'description',
      },
      {
        name: 'FromCollectiveId',
        type: 'component',
        component: AddFundsSourcePickerForUserWithData,
        labelName: 'FromCollectiveId.addfundstoorg.label',
        options: {
          LoggedInUser: this.props.LoggedInUser,
        },
      },
    ];

    this.fields = this.fields.map(field => {
      const label = this.messages[field.labelName || `${field.name}.label`];
      if (label) {
        field.label = intl.formatMessage(label);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    });
  }

  retrieveHostFeePercent = async CollectiveId => {
    try {
      const result = await this.props.client.query({
        query: addPrepaidBudgetHostFeePercentQuery,
        variables: { CollectiveId },
      });
      const { hostFeePercent } = result.data.Collective;
      return hostFeePercent;
    } catch (error) {
      // TODO: this should be reported to the user
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  handleChange = async (obj, attr, value) => {
    const { host } = this.props;

    const newState = { ...this.state };

    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (attr === 'FromCollectiveId') {
      value = Number(value);
      if (host && value !== host.id) {
        newState[obj].hostFeePercent = this.props.collective.hostFeePercent;
      } else {
        /* We don't have the host object if we're adding funds to
           orgs. The attr props.collective contains the organization
           receiving funds and the right host must be pulled from
           GraphQL when the user chooses an option in the combo. */
        newState[obj].hostFeePercent = await this.retrieveHostFeePercent(value);
      }
    }

    this.setState(newState);
  };

  handleSubmit() {
    this.props.onSubmit(this.state.form);
    return false;
  }

  render() {
    const { loading } = this.props;
    const hostFeePercent = this.state.form.hostFeePercent || 0;

    const hostFeeAmount = formatCurrency(
      Math.round((hostFeePercent / 100) * this.state.form.totalAmount),
      this.props.collective.currency,
      { precision: 2 },
    );

    const netAmount = formatCurrency(
      Math.round(this.state.form.totalAmount * (1 - hostFeePercent / 100)),
      this.props.collective.currency,
      { precision: 2 },
    );

    // recompute this value based on new props
    this.totalAmountField.pre = getCurrencySymbol(this.props.collective.currency);

    return (
      <Container maxWidth="700px" margin="0 auto">
        <form onSubmit={e => e.preventDefault()}>
          <H2 fontSize="2rem">
            <FormattedMessage
              id="addPrepaidBudget.title"
              defaultMessage="Add Prepaid Budget to {collective}"
              values={{ collective: this.props.collective.name }}
            />
          </H2>
          {this.fields.map(
            field =>
              (!field.when || field.when(this.state.form)) && (
                <Flex key={`${field.name}.input`} flexWrap="wrap">
                  <Box width={1}>
                    <InputField
                      {...field}
                      className={`horizontal ${field.className}`}
                      defaultValue={this.state.form[field.name]}
                      onChange={value => this.handleChange('form', field.name, value)}
                    />
                  </Box>
                </Flex>
              ),
          )}
          <Flex flexWrap="wrap">
            <Box width={[1, 2 / 12]}>
              <Strong>
                <FormattedMessage id="Details" defaultMessage="Details" />
              </Strong>
            </Box>
            <Box width={[1, 10 / 12]}>
              <TableContainer>
                <tbody>
                  <tr>
                    <td>
                      <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
                    </td>
                    <td className="amount">
                      {formatCurrency(this.state.form.totalAmount, this.props.collective.currency, {
                        precision: 2,
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FormattedMessage
                        id="addfunds.hostFees"
                        defaultMessage="Host fees ({hostFees})"
                        values={{ hostFees: `${hostFeePercent}%` }}
                      />
                    </td>
                    <td className="amount">{hostFeeAmount}</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <hr size={1} />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <FormattedMessage id="addfunds.netAmount" defaultMessage="Net amount" />
                    </td>
                    <td className="amount">{netAmount}</td>
                  </tr>
                </tbody>
              </TableContainer>
            </Box>
          </Flex>
          <Flex flexWrap="wrap" pl={3} pr={3}>
            <Box width={[1, 2 / 12]} />
            <Box width={[1, 10 / 12]} className="actions">
              <StyledButton buttonStyle="primary" onClick={this.handleSubmit} loading={loading}>
                {loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
                {!loading && <FormattedMessage id="menu.addPrepaidBudget" defaultMessage="Add Prepaid Budget" />}
              </StyledButton>
              <StyledButton m={2} onClick={this.props.onCancel}>
                <FormattedMessage id="form.cancel" defaultMessage="cancel" />
              </StyledButton>
            </Box>
          </Flex>
        </form>
        <Container marginTop="3rem">
          {this.state.result.success && <Container width="100%">{this.state.result.success}</Container>}
          {this.state.result.error && (
            <Container width="100%" color="red" fontWeight="bold">
              {this.state.result.error}
            </Container>
          )}
        </Container>
      </Container>
    );
  }
}

export default injectIntl(withApollo(AddPrepaidBudgetForm));
