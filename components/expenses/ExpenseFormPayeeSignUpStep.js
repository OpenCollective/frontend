import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { FastField, Field } from 'formik';
import { isEmpty, omit, pick } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { suggestSlug } from '../../lib/collective.lib';
import expenseTypes from '../../lib/constants/expenseTypes';
import { ERROR, isErrorType } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { flattenObjectDeep } from '../../lib/utils';

import { Box, Flex, Grid } from '../Grid';
import I18nAddressFields from '../I18nAddressFields';
import InputTypeCountry from '../InputTypeCountry';
import LoginBtn from '../LoginBtn';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledInputGroup from '../StyledInputGroup';
import StyledTextarea from '../StyledTextarea';
import { Span } from '../Text';

import PayoutMethodForm, { validatePayoutMethod } from './PayoutMethodForm';
import PayoutMethodSelect from './PayoutMethodSelect';

const EMPTY_ARRAY = [];

const msg = defineMessages({
  nameLabel: {
    id: `ExpenseForm.inviteeLabel`,
    defaultMessage: 'Who will receive the money for this expense?',
  },
  emailLabel: {
    id: 'Form.yourEmail',
    defaultMessage: 'Your email address',
  },
  inviteeType: {
    id: 'ExpenseForm.inviteeIsOrganizationLabel',
    defaultMessage: 'Are you submitting this expense for your organization (company)?',
  },
  orgNameLabel: {
    id: 'ExpenseForm.inviteeOrgNameLabel',
    defaultMessage: "What's the name of the organization?",
  },
  orgSlugLabel: {
    id: 'createCollective.form.slugLabel',
    defaultMessage: 'Set your URL',
  },
  orgWebsiteLabel: {
    id: 'createOrg.form.websiteLabel',
    defaultMessage: 'Organization website',
  },
  orgDescriptionLabel: {
    id: 'ExpenseForm.inviteeOrgDescriptionLabel',
    defaultMessage: 'What does your organization do?',
  },
  payoutOptionLabel: {
    id: `ExpenseForm.PayoutOptionLabel`,
    defaultMessage: 'Payout method',
  },
  invoiceInfo: {
    id: 'ExpenseForm.InvoiceInfo',
    defaultMessage: 'Additional invoice information',
  },
  invoiceInfoPlaceholder: {
    id: 'ExpenseForm.InvoiceInfoPlaceholder',
    defaultMessage: 'Tax ID, VAT number, etc. This information will be printed on your invoice.',
  },
  country: {
    id: 'ExpenseForm.ChooseCountry',
    defaultMessage: 'Choose country',
  },
  address: {
    id: 'ExpenseForm.AddressLabel',
    defaultMessage: 'Physical address',
  },
});

const PAYEE_TYPE = {
  USER: 'USER',
  ORG: 'ORG',
};

const Fieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
`;

const RadioOptionContainer = styled.label`
  align-items: center;
  display: flex;
  flex: 1 1 50%;
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  margin: 0px;
  padding: 6px 16px;
  cursor: pointer;

  :not(:last-child) {
    @media (max-width: ${themeGet('breakpoints.0')}) {
      border-bottom: 1px solid #dcdee0;
    }
    @media (min-width: ${themeGet('breakpoints.0')}) {
      border-right: 1px solid #dcdee0;
    }
  }
`;

const ExpenseFormPayeeSignUpStep = ({ formik, collective, onCancel, onNext }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, errors } = formik;
  const stepOneCompleted =
    isEmpty(flattenObjectDeep(validatePayoutMethod(values.payoutMethod))) &&
    (values.type === expenseTypes.RECEIPT ||
      (values.payoutMethod && values.payeeLocation?.country && values.payeeLocation?.address));

  const setPayoutMethod = React.useCallback(({ value }) => formik.setFieldValue('payoutMethod', value), []);
  const [payeeType, setPayeeType] = React.useState(PAYEE_TYPE.USER);
  const changePayeeType = e => {
    e.stopPropagation();
    setPayeeType(e.target.value);
  };

  React.useEffect(() => {
    if (values.payee?.organization?.name) {
      formik.setFieldValue('payee.organization.slug', suggestSlug(values.payee.organization.name));
    }
  }, [values.payee?.organization?.name]);
  React.useEffect(() => {
    if (payeeType === PAYEE_TYPE.USER) {
      formik.setFieldValue('payee', omit(values.payee, ['organization']));
    }
  }, [payeeType]);

  return (
    <Fragment>
      <StyledInputField label="How you will receive the money of this expense?" labelFontSize="13px" mt={3}>
        <StyledCard>
          <Fieldset onChange={changePayeeType}>
            <Flex flexDirection={['column', 'row']} overflow="hidden">
              <RadioOptionContainer>
                <Box alignSelf={['center', 'baseline', null, 'center']} mr="16px">
                  <input
                    type="radio"
                    name="payeeType"
                    checked={payeeType === PAYEE_TYPE.USER}
                    value={PAYEE_TYPE.USER}
                    onChange={changePayeeType}
                  />
                </Box>
                <Box>Personal Account</Box>
              </RadioOptionContainer>
              <RadioOptionContainer>
                <Box alignSelf={['center', 'baseline', null, 'center']} mr="16px">
                  <input
                    type="radio"
                    name="payeeType"
                    checked={payeeType === PAYEE_TYPE.ORG}
                    value={PAYEE_TYPE.ORG}
                    onChange={changePayeeType}
                  />
                </Box>
                <Box>Organization Account</Box>
              </RadioOptionContainer>
            </Flex>
          </Fieldset>
        </StyledCard>
      </StyledInputField>

      {payeeType === PAYEE_TYPE.ORG && (
        <Fragment>
          <Grid gridTemplateColumns={['100%', 'calc(50% - 8px) calc(50% - 8px)']} gridColumnGap={[null, 2, null, 3]}>
            <Field name="payee.organization.name">
              {({ field }) => (
                <StyledInputField name={field.name} label={formatMessage(msg.orgNameLabel)} labelFontSize="13px" mt={3}>
                  {inputProps => <StyledInput {...inputProps} {...field} placeholder="e.g. Airbnb, Salesforce" />}
                </StyledInputField>
              )}
            </Field>
            <Field name="payee.organization.slug">
              {({ field }) => (
                <StyledInputField name={field.name} label={formatMessage(msg.orgSlugLabel)} labelFontSize="13px" mt={3}>
                  {inputProps => <StyledInputGroup {...inputProps} {...field} prepend="opencollective.com/" />}
                </StyledInputField>
              )}
            </Field>
            <Field name="payee.organization.website">
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  label={formatMessage(msg.orgWebsiteLabel)}
                  labelFontSize="13px"
                  mt={3}
                >
                  {inputProps => <StyledInputGroup {...inputProps} {...field} prepend="http://" />}
                </StyledInputField>
              )}
            </Field>

            <Field name="payee.organization.description">
              {({ field }) => (
                <StyledInputField
                  name={field.name}
                  label={formatMessage(msg.orgDescriptionLabel)}
                  labelFontSize="13px"
                  mt={3}
                >
                  {inputProps => <StyledInput {...inputProps} {...field} placeholder="" />}
                </StyledInputField>
              )}
            </Field>
          </Grid>
        </Fragment>
      )}

      <Grid
        gridTemplateColumns={['100%', 'calc(50% - 8px) calc(50% - 8px)']}
        gridColumnGap={[null, 2, null, 3]}
        gridAutoFlow="dense"
      >
        <Box>
          <Field name="payee.name">
            {({ field }) => (
              <StyledInputField name={field.name} label={formatMessage(msg.nameLabel)} labelFontSize="13px" mt={3}>
                {inputProps => <StyledInput {...inputProps} {...field} />}
              </StyledInputField>
            )}
          </Field>
          {payeeType === PAYEE_TYPE.ORG && (
            <Span fontSize="11px" lineHeight="16px" color="black.600">
              <FormattedMessage
                id="ExpenseForm.SignUp.OrgAdminNote"
                defaultMessage="You need to be an admin of the Organization to submit expenses."
              />
            </Span>
          )}
        </Box>
        <Box>
          <Field name="payee.email" required>
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.emailLabel)}
                labelFontSize="13px"
                error={errors.payee?.email}
                mt={3}
              >
                {inputProps => <StyledInput {...inputProps} {...field} type="email" />}
              </StyledInputField>
            )}
          </Field>
          <Span fontSize="11px" lineHeight="16px" color="black.600">
            <FormattedMessage
              id="ExpenseForm.SignUp.SignIn"
              defaultMessage="We will use this email to create your account. If you already have an account {loginLink}."
              values={{ loginLink: <LoginBtn asLink /> }}
            />
          </Span>
        </Box>
        <Box>
          <FastField name="payeeLocation.country">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.country)}
                labelFontSize="13px"
                error={formatFormErrorMessage(intl, errors.payeeLocation?.country)}
                required
                mt={3}
              >
                {({ id, error }) => (
                  <InputTypeCountry
                    data-cy="payee-country"
                    inputId={id}
                    onChange={value => formik.setFieldValue(field.name, value)}
                    value={field.value}
                    error={error}
                  />
                )}
              </StyledInputField>
            )}
          </FastField>
          <I18nAddressFields
            prefix="payeeLocation.structured"
            selectedCountry={values.payeeLocation?.country}
            onCountryChange={addressObject => {
              if (addressObject) {
                formik.setFieldValue('payeeLocation.structured', addressObject);
              }
            }}
          />
        </Box>
        <Box>
          <Field name="payoutMethod">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                htmlFor="payout-method"
                flex="1"
                mt={3}
                label={formatMessage(msg.payoutOptionLabel)}
                labelFontSize="13px"
                error={
                  isErrorType(errors.payoutMethod, ERROR.FORM_FIELD_REQUIRED)
                    ? formatFormErrorMessage(intl, errors.payoutMethod)
                    : null
                }
              >
                {({ id, error }) => (
                  <PayoutMethodSelect
                    inputId={id}
                    error={error}
                    onChange={setPayoutMethod}
                    payoutMethod={values.payoutMethod}
                    payoutMethods={EMPTY_ARRAY}
                    payee={values.payee}
                    disabled={!values.payee}
                    collective={collective}
                  />
                )}
              </StyledInputField>
            )}
          </Field>
          {values.payoutMethod && (
            <Field name="payoutMethod">
              {({ field, meta }) => (
                <Box mt={3} flex="1">
                  <PayoutMethodForm
                    fieldsPrefix="payoutMethod"
                    payoutMethod={field.value}
                    host={collective.host}
                    errors={meta.error}
                  />
                </Box>
              )}
            </Field>
          )}
        </Box>

        <FastField name="invoiceInfo">
          {({ field }) => (
            <StyledInputField
              name={field.name}
              label={formatMessage(msg.invoiceInfo)}
              labelFontSize="13px"
              required={false}
              mt={3}
              gridColumn={1}
            >
              {inputProps => (
                <Field
                  as={StyledTextarea}
                  {...inputProps}
                  {...field}
                  minHeight={80}
                  placeholder={formatMessage(msg.invoiceInfoPlaceholder)}
                />
              )}
            </StyledInputField>
          )}
        </FastField>
      </Grid>
      {values.payee && (
        <Fragment>
          <StyledHr flex="1" mt={4} borderColor="black.300" />
          <Flex mt={3} flexWrap="wrap">
            {onCancel && (
              <StyledButton
                type="button"
                width={['100%', 'auto']}
                mx={[2, 0]}
                mr={[null, 3]}
                mt={2}
                whiteSpace="nowrap"
                data-cy="expense-cancel"
                disabled={!stepOneCompleted}
                onClick={() => {
                  onCancel?.();
                }}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
            )}
            <StyledButton
              type="button"
              width={['100%', 'auto']}
              mx={[2, 0]}
              mr={[null, 3]}
              mt={2}
              whiteSpace="nowrap"
              data-cy="expense-next"
              buttonStyle="primary"
              disabled={!stepOneCompleted}
              onClick={async () => {
                const allErrors = await formik.validateForm();
                const errors = omit(pick(allErrors, ['payee', 'payoutMethod', 'payeeLocation']), [
                  'payoutMethod.data.currency',
                ]);
                if (isEmpty(flattenObjectDeep(errors))) {
                  onNext?.();
                } else {
                  // We use set touched here to display errors on fields that are not dirty.
                  formik.setTouched(errors);
                  formik.setErrors(errors);
                }
              }}
            >
              <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
              &nbsp;→
            </StyledButton>
          </Flex>
        </Fragment>
      )}
    </Fragment>
  );
};

ExpenseFormPayeeSignUpStep.propTypes = {
  formik: PropTypes.object,
  onCancel: PropTypes.func,
  onNext: PropTypes.func,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
    settings: PropTypes.object,
  }).isRequired,
};

export default ExpenseFormPayeeSignUpStep;
