import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { Box, Flex } from '@rebass/grid';
import { first, isEmpty, get, pick } from 'lodash';
import { Formik, Form, Field, FieldArray, FastField } from 'formik';

import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { P } from '../Text';
import ExpenseTypeRadioSelect from './ExpenseTypeRadioSelect';
import StyledInput from '../StyledInput';
import StyledHr from '../StyledHr';
import ExpenseFormAttachments from './ExpenseFormAttachments';
import StyledInputField from '../StyledInputField';
import CollectivePicker from '../CollectivePicker';
import StyledButton from '../StyledButton';
import PayoutMethodSelect from './PayoutMethodSelect';
import StyledTextarea from '../StyledTextarea';
import PayoutMethodForm, { validatePayoutMethod } from './PayoutMethodForm';
import { requireFields, formatFormErrorMessage } from '../../lib/form-utils';
import { ERROR, isErrorType } from '../../lib/errors';
import { validateAttachment } from './ExpenseAttachmentForm';

const msg = defineMessages({
  descriptionPlaceholder: {
    id: `ExpenseForm.DescriptionPlaceholder`,
    defaultMessage: 'Enter expense title',
  },
  payeeLabel: {
    id: `ExpenseForm.payeeLabel`,
    defaultMessage: 'Who is being paid for this expense?',
  },
  payoutOptionLabel: {
    id: `ExpenseForm.PayoutOptionLabel`,
    defaultMessage: 'Choose payout option',
  },
  invoiceInfo: {
    id: 'ExpenseForm.InvoiceInfo',
    defaultMessage: 'Additional invoice information',
  },
  invoiceInfoPlaceholder: {
    id: 'ExpenseForm.InvoiceInfoPlaceholder',
    defaultMessage: 'Tax ID, VAT number, etc. This information will be printed on your invoice.',
  },
  leaveWithUnsavedChanges: {
    id: 'ExpenseForm.UnsavedChangesWarning',
    defaultMessage: 'If you cancel now you will loose any changes made to this expense. Are you sure?',
  },
});

const getDefaultExpense = (collective, payoutProfiles) => ({
  description: '',
  attachments: [],
  payee: first(payoutProfiles),
  payoutMethod: undefined,
  privateInfo: '',
  currency: collective.currency,
});

/**
 * Take the expense's data as generated by `ExpenseForm` and strips out all optional data
 * like URLs for attachments when the expense is an invoice.
 */
export const prepareExpenseForSubmit = expenseData => {
  return {
    ...pick(expenseData, ['id', 'description', 'type', 'privateMessage']),
    payee: pick(expenseData.payee, ['id']),
    payoutMethod: pick(expenseData.payoutMethod, ['id', 'name', 'data', 'isSaved', 'type']),
    // Omit attachment's ids that were created for keying purposes
    attachments: expenseData.attachments.map(attachment => {
      return pick(attachment, [
        ...(attachment.__isNew ? [] : ['id']),
        ...(attachment.type === expenseTypes.INVOICE ? [] : ['url']), // never submit URLs for invoices
        'description',
        'incurredAt',
        'amount',
      ]);
    }),
  };
};

/**
 * Validate the expense
 */
const validate = expense => {
  const errors = requireFields(expense, ['description', 'payee', 'payoutMethod', 'currency']);

  if (expense.attachments.length > 0) {
    const attachmentsErrors = expense.attachments.map(attachment => validateAttachment(expense, attachment));
    const hasErrors = attachmentsErrors.some(errors => !isEmpty(errors));
    if (hasErrors) {
      errors.attachments = attachmentsErrors;
    }
  }

  if (expense.payoutMethod) {
    const payoutMethodErrors = validatePayoutMethod(expense.payoutMethod);
    if (!isEmpty(payoutMethodErrors)) {
      errors.payoutMethod = payoutMethodErrors;
    }
  }

  return errors;
};

// Margin x between inline fields, not displayed on mobile
const fieldsMarginRight = [2, 3, 4];

const ExpenseFormBody = ({ formik, payoutProfiles, collective, autoFocusTitle, onCancel }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, handleChange, errors } = formik;
  const hasBaseFormFieldsCompleted = values.type && values.description;
  const stepOneCompleted = hasBaseFormFieldsCompleted && values.attachments.length > 0;
  const stepTwoCompleted = stepOneCompleted && values.payoutMethod;

  // When user logs in we set its account as the default payout profile if not yet defined
  React.useEffect(() => {
    if (!values.payee && !isEmpty(payoutProfiles)) {
      formik.setFieldValue('payee', first(payoutProfiles));
    }
  }, [payoutProfiles]);

  return (
    <Form>
      <P fontSize="LeadParagraph" fontWeight="500" mb={3} color="black.800">
        <FormattedMessage id="ExpenseForm.Type" defaultMessage="Which type of expense is it? " />
      </P>
      <ExpenseTypeRadioSelect name="type" onChange={handleChange} value={values.type} />
      {values.type && (
        <Box mt={4} width="100%">
          <Field
            as={StyledInput}
            autoFocus={autoFocusTitle}
            name="description"
            placeholder={formatMessage(msg.descriptionPlaceholder)}
            width="100%"
            fontSize="H4"
            border="0"
            error={errors.description}
            px={0}
            maxLength={255}
            withOutline
          />
          {errors.description && (
            <P color="red.500" mt={2}>
              {formatFormErrorMessage(intl, errors.description)}
            </P>
          )}
          <StyledHr mt={3} borderColor="black.300" />
          <P color={hasBaseFormFieldsCompleted ? 'black.900' : 'black.300'} fontSize="LeadParagraph" my={24}>
            {values.type === expenseTypes.RECEIPT ? (
              <FormattedMessage id="ExpenseForm.Step1" defaultMessage="1. Upload one or multiple receipts" />
            ) : (
              <FormattedMessage id="ExpenseForm.Step1Invoice" defaultMessage="1. Set invoice details" />
            )}
          </P>
          {hasBaseFormFieldsCompleted && (
            <Box>
              <FieldArray name="attachments" component={ExpenseFormAttachments} />
            </Box>
          )}
          <StyledHr borderColor="black.300" />
          <P fontSize="LeadParagraph" mt={24} mb={3} color={stepOneCompleted ? 'black.900' : 'black.300'}>
            <FormattedMessage id="ExpenseForm.Step2" defaultMessage="2. Payee & payout information" />
          </P>
          {stepOneCompleted && (
            <Box>
              <Flex justifyContent="space-between" flexWrap="wrap">
                <FastField name="payee">
                  {({ field }) => (
                    <StyledInputField
                      name={field.name}
                      label={formatMessage(msg.payeeLabel)}
                      flex="1"
                      minWidth={250}
                      mr={fieldsMarginRight}
                      mt={2}
                    >
                      {({ id }) => (
                        <CollectivePicker
                          inputId={id}
                          collectives={payoutProfiles}
                          getDefaultOptions={build => values.payee && build(values.payee)}
                          onChange={({ value }) => {
                            formik.setFieldValue('payee', value);
                            formik.setFieldValue('payoutMethod', null);
                          }}
                        />
                      )}
                    </StyledInputField>
                  )}
                </FastField>

                <Field name="payoutMethod">
                  {({ field }) => (
                    <StyledInputField
                      name={field.name}
                      htmlFor="payout-method"
                      flex="1"
                      mr={fieldsMarginRight}
                      mt={2}
                      minWidth={250}
                      label={formatMessage(msg.payoutOptionLabel)}
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
                          onChange={({ value }) => formik.setFieldValue('payoutMethod', value)}
                          payoutMethod={values.payoutMethod}
                          payoutMethods={get(values.payee, 'payoutMethods', [])}
                          disabled={!values.payee}
                          collective={collective}
                          default
                        />
                      )}
                    </StyledInputField>
                  )}
                </Field>
              </Flex>
              <Flex justifyContent="space-between" mt={3} flexWrap="wrap">
                {values.type === expenseTypes.INVOICE && (
                  <FastField name="invoiceInfo">
                    {({ field }) => (
                      <StyledInputField
                        name={field.name}
                        label={formatMessage(msg.invoiceInfo)}
                        required={false}
                        flex="1"
                        minWidth={300}
                        maxWidth={[null, null, '46%']}
                        mr={fieldsMarginRight}
                        mt={2}
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
                )}
                {values.payoutMethod && (
                  <FastField name="payoutMethod">
                    {({ field, meta }) => (
                      <Box mr={fieldsMarginRight} mt={2} flex="1" minWidth={300}>
                        <PayoutMethodForm
                          fieldsPrefix="payoutMethod"
                          payoutMethod={field.value}
                          collective={collective}
                          errors={meta.error}
                        />
                      </Box>
                    )}
                  </FastField>
                )}
              </Flex>
            </Box>
          )}
          <StyledHr borderColor="black.300" my={4} />
          {onCancel && (
            <StyledButton
              type="button"
              data-cy="expense-cancel-btn"
              disabled={formik.isSubmitting}
              minWidth={170}
              mr={2}
              onClick={() => {
                if (!formik.dirty || confirm(formatMessage(msg.leaveWithUnsavedChanges))) {
                  onCancel();
                }
              }}
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
          )}
          <StyledButton
            type="submit"
            data-cy="expense-summary-btn"
            buttonStyle="primary"
            disabled={!stepTwoCompleted || !formik.isValid || !formik.dirty}
            loading={formik.isSubmitting}
            minWidth={170}
          >
            <FormattedMessage id="Expense.summary" defaultMessage="Expense summary" />
          </StyledButton>
        </Box>
      )}
    </Form>
  );
};

ExpenseFormBody.propTypes = {
  formik: PropTypes.object,
  payoutProfiles: PropTypes.array,
  autoFocusTitle: PropTypes.bool,
  onCancel: PropTypes.func,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
  }).isRequired,
};

/**
 * Main create expense form
 */
const ExpenseForm = ({ onSubmit, collective, expense, payoutProfiles, autoFocusTitle, onCancel, validateOnChange }) => {
  const [hasValidate, setValidate] = React.useState(validateOnChange);

  return (
    <Formik
      initialValues={{ ...getDefaultExpense(collective, payoutProfiles), ...expense }}
      validate={hasValidate && validate}
      onSubmit={async (values, formik) => {
        // We initially let the browser do the validation. Then once users try to submit the
        // form at least once, we validate on each change to make sure they fix all the errors.
        const errors = validate(values);
        if (!isEmpty(errors)) {
          setValidate(true);
          formik.setErrors(errors);
        } else {
          return onSubmit(values);
        }
      }}
    >
      {formik => (
        <ExpenseFormBody
          formik={formik}
          payoutProfiles={payoutProfiles}
          collective={collective}
          autoFocusTitle={autoFocusTitle}
          onCancel={onCancel}
        />
      )}
    </Formik>
  );
};

ExpenseForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  autoFocusTitle: PropTypes.bool,
  validateOnChange: PropTypes.bool,
  onCancel: PropTypes.func,
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
  }).isRequired,
  /** If editing */
  expense: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(expenseTypes)),
    description: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string,
      }),
    ),
  }),
  /** Payout profiles that user has access to */
  payoutProfiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string,
      payoutMethods: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.oneOf(Object.values(PayoutMethodType)),
          name: PropTypes.string,
          data: PropTypes.object,
        }),
      ),
    }),
  ),
};

ExpenseForm.defaultProps = {
  validateOnChange: false,
};

export default React.memo(ExpenseForm);
