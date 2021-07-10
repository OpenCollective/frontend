import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FastField, Field } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isEmail } from 'validator';

import { ERROR, isErrorType } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';

import { Box, Flex, Grid } from '../Grid';
import I18nAddressFields from '../I18nAddressFields';
import InputTypeCountry from '../InputTypeCountry';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledLinkButton from '../StyledLinkButton';
import StyledTextarea from '../StyledTextarea';
import { P } from '../Text';

import PayoutMethodForm from './PayoutMethodForm';
import PayoutMethodSelect from './PayoutMethodSelect';

const EMPTY_ARRAY = [];

const msg = defineMessages({
  nameLabel: {
    id: `ExpenseForm.inviteeLabel`,
    defaultMessage: 'Who will receive the money for this expense?',
  },
  emailTitle: {
    id: 'User.EmailAddress',
    defaultMessage: 'Email address',
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
  recipientNoteLabel: {
    id: 'ExpenseForm.RecipientNoteLabel',
    defaultMessage: 'Add a note for the recipient',
  },
  additionalInfo: {
    id: 'ExpenseForm.inviteAdditionalInfo',
    defaultMessage: 'If you have additional information about the payment details, you can add them by clicking below.',
  },
});

const ExpenseFormPayeeInviteNewStep = ({ formik, collective, onBack, onNext }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, errors } = formik;
  const stepOneCompleted = values.payee?.name && values.payee?.email && isEmail(values.payee.email);

  const setPayoutMethod = React.useCallback(({ value }) => formik.setFieldValue('payoutMethod', value), []);
  const [showAdditionalInfo, setAdditionalInfo] = React.useState(false);

  return (
    <Fragment>
      <P fontSize="11px" color="black.600">
        <FormattedMessage id="form.requiredFields" defaultMessage="Fields marked with (*) are mandatory." />
      </P>
      <Grid
        gridTemplateColumns={['100%', 'calc(50% - 8px) calc(50% - 8px)']}
        gridColumnGap={[null, 2, null, 3]}
        gridAutoFlow="dense"
      >
        <Box>
          <Field name="payee.name">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.nameLabel)}
                labelFontSize="13px"
                mt={3}
                hideOptionalLabel
                required
              >
                {inputProps => <StyledInput {...inputProps} {...field} />}
              </StyledInputField>
            )}
          </Field>
        </Box>
        <Box>
          <Field name="payee.email" required>
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.emailTitle)}
                labelFontSize="13px"
                error={errors.payee?.email}
                mt={3}
                hideOptionalLabel
                required
              >
                {inputProps => <StyledInput {...inputProps} {...field} type="email" />}
              </StyledInputField>
            )}
          </Field>
        </Box>

        {!showAdditionalInfo ? (
          <Box gridColumn={[null, '1 / span 2']} mt={3}>
            <MessageBox type="info">
              <P fontSize="12px">{formatMessage(msg.additionalInfo)}</P>
              <P fontSize="12px" mt={2}>
                <StyledLinkButton onClick={() => setAdditionalInfo(true)}>
                  <FormattedMessage id="ExpenseForm.inviteAdditionalInfoBtn" defaultMessage="Add Additional Details" />
                </StyledLinkButton>
              </P>
            </MessageBox>
          </Box>
        ) : (
          <Fragment>
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
                required={false}
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
                  hideOptionalLabel
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
          </Fragment>
        )}
      </Grid>
      <Box>
        <Field name="recipientNote">
          {({ field }) => (
            <StyledInputField
              name={field.name}
              label={formatMessage(msg.recipientNoteLabel)}
              labelFontSize="13px"
              required={false}
              hideOptionalLabel
              mt={3}
            >
              {inputProps => <Field as={StyledTextarea} {...inputProps} {...field} minHeight={80} />}
            </StyledInputField>
          )}
        </Field>
      </Box>
      {values.payee && (
        <Fragment>
          <StyledHr flex="1" mt={4} borderColor="black.300" />
          <Flex mt={3} flexWrap="wrap">
            {onBack && (
              <StyledButton
                type="button"
                width={['100%', 'auto']}
                mx={[2, 0]}
                mr={[null, 3]}
                mt={2}
                whiteSpace="nowrap"
                data-cy="expense-cancel"
                onClick={() => {
                  onBack?.();
                }}
              >
                ←&nbsp;
                <FormattedMessage id="Back" defaultMessage="Back" />
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
                onNext?.();
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

ExpenseFormPayeeInviteNewStep.propTypes = {
  formik: PropTypes.object,
  payoutProfiles: PropTypes.array,
  onBack: PropTypes.func,
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

export default ExpenseFormPayeeInviteNewStep;
