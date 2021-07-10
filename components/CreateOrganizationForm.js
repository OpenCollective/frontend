import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Field, Form, Formik } from 'formik';
import { trim } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import slugify from 'slugify';

import { BackButton } from './create-collective/CreateCollectiveForm';
import OnboardingProfileCard from './onboarding-modal/OnboardingProfileCard';
import CollectivePickerAsync from './CollectivePickerAsync';
import Container from './Container';
import { Box, Flex } from './Grid';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledHr from './StyledHr';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledInputGroup from './StyledInputGroup';
import StyledTextarea from './StyledTextarea';
import { H1, H4, P } from './Text';
import { withUser } from './UserProvider';

const orgMessages = defineMessages({
  nameLabel: { id: 'Organization.Name', defaultMessage: 'Organization name' },
  slugLabel: { id: 'createCollective.form.slugLabel', defaultMessage: 'Set your URL' },
  descriptionPlaceholder: {
    id: 'create.collective.placeholder',
    defaultMessage: 'Making the world a better place',
  },
  websiteLabel: { id: 'createOrg.form.websiteLabel', defaultMessage: 'Organization website' },
  suggestedLabel: { id: 'createCollective.form.suggestedLabel', defaultMessage: 'Suggested' },
  descriptionLabel: {
    id: 'ExpenseForm.inviteeOrgDescriptionLabel',
    defaultMessage: 'What does your organization do?',
  },
  descriptionHint: {
    id: 'createCollective.form.descriptionHint',
    defaultMessage: 'Write a short description (150 characters max)',
  },
  errorName: {
    id: 'createCollective.form.error.name',
    defaultMessage: 'Please use fewer than 50 characters',
  },
  errorDescription: {
    id: 'createCollective.form.error.description',
    defaultMessage: 'Please use fewer than 160 characters',
  },
  errorSlug: {
    id: 'createCollective.form.error.slug',
    defaultMessage: 'Please use fewer than 30 characters',
  },
  errorSlugHyphen: {
    id: 'createOrg.form.error.slug.hyphen',
    defaultMessage: 'Organization URL slug cannot start or end with a hyphen (-)',
  },
  errorWebsite: {
    id: 'createOrg.form.error.website',
    defaultMessage: 'Enter a valid website, e.g. www.example.com or example.org',
  },
});

const placeholders = {
  name: { id: 'placeholder.name', defaultMessage: 'e.g. Salesforce, Airbnb' },
  slug: { id: 'placeholder.slug', defaultMessage: 'Airbnb' },
  description: { id: 'placeholderdescription', defaultMessage: 'Making a world a better place' },
  website: { id: 'placeholder.website', defaultMessage: 'www.example.com' },
  username: { id: 'placeholder.username', defaultMessage: 'User name' },
};

const CreateOrganizationForm = props => {
  const { intl, error, loading, LoggedInUser, onSubmit, updateAdmins } = props;
  const [authorization, setAuthorization] = useState(false);
  const [admins, setAdmins] = useState([{ role: 'ADMIN', member: LoggedInUser.collective }]);
  const initialValues = {
    name: '',
    slug: '',
    description: '',
    website: '',
    coAdmin: '',
  };
  const validate = values => {
    const errors = {};

    if (values.name.length > 50) {
      errors.name = intl.formatMessage(orgMessages.errorName);
    }
    if (values.slug.length > 30) {
      errors.slug = intl.formatMessage(orgMessages.errorSlug);
    }
    if (values.slug !== trim(values.slug, '-')) {
      errors.slug = intl.formatMessage(orgMessages.errorSlugHyphen);
    }
    if (values.description.length > 150) {
      errors.description = intl.formatMessage(orgMessages.errorDescription);
    }
    const regexExp = /[-a-zA-Z0-9@:%._/+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_/+.~#?&//=]*)?/gi;

    if ((values.website && !values.website.match(new RegExp(regexExp))) || values.website.startsWith('http')) {
      errors.website = intl.formatMessage(orgMessages.errorWebsite);
    }
    return errors;
  };
  const submit = values => {
    const { name, slug, description, website } = values;
    onSubmit({ name, slug, description, website, authorization });
  };

  const removeAdmin = collective => {
    const filteredAdmins = admins.filter(admin => admin.member.id !== collective.id);
    setAdmins(filteredAdmins);
    updateAdmins(admins);
  };

  // Update admins whenever there is a change
  useEffect(() => {
    if (admins.length) {
      updateAdmins(admins);
    }
  }, [admins]);

  return (
    <Flex flexDirection="column" justifyContent="center">
      <Formik validate={validate} initialValues={initialValues} onSubmit={submit} validateOnChange={true}>
        {formik => {
          const { values, handleSubmit, errors, touched, setFieldValue } = formik;
          const suggestedSlug = value => {
            const slugOptions = {
              replacement: '-',
              lower: true,
              strict: true,
            };
            return trim(slugify(value, slugOptions), '-');
          };
          const handleSlugChange = e => {
            if (!touched.slug) {
              setFieldValue('slug', suggestedSlug(e.target.value));
            }
          };
          return (
            <Form>
              <Flex flexDirection="column" alignItems="center">
                <Box mx={2} maxWidth="992px">
                  <Flex flexDirection="column" my={[0, 2]} mb={[24, 28, 28, 58]}>
                    <Box>
                      <BackButton asLink onClick={() => window && window.history.back()} px={[0, 2]}>
                        ←&nbsp;
                        <FormattedMessage id="Back" defaultMessage="Back" />
                      </BackButton>
                    </Box>
                    <Box alignItems="center" px={[0, 2]}>
                      <H1
                        fontSize="28px"
                        lineHeight="36px"
                        fontWeight="500"
                        textAlign={['left', 'left', 'left', 'center']}
                        color="black.900"
                        letterSpacing="1px"
                      >
                        <FormattedMessage id="organization.create" defaultMessage="Create Organization" />
                      </H1>
                    </Box>
                    {error && !loading && (
                      <Flex alignItems="center" justifyContent="center">
                        <MessageBox type="error" withIcon mt={[1, 3]} data-cy="cof-error-message">
                          {error}
                        </MessageBox>
                      </Flex>
                    )}
                  </Flex>

                  <Container display="flex" flexDirection={['column', 'row', 'row']}>
                    <Flex
                      flexDirection="column"
                      mx={[1, 10, 10]}
                      maxWidth={[320, 350, 472]}
                      justifyContent="space-around"
                    >
                      <H4 color="black.900" fontSize="18px">
                        <FormattedMessage id="CreateProfile.OrgInfo" defaultMessage="Organization info" />
                      </H4>
                      <StyledInputField
                        name="name"
                        htmlFor="name"
                        error={touched.name && errors.name}
                        label={intl.formatMessage(orgMessages.nameLabel)}
                        labelFontSize="13px"
                        labelColor="black.700"
                        labelFontWeight="600"
                        fontSize="18px"
                        value={values.name}
                        onChange={handleSlugChange}
                        required
                        mt={3}
                        data-cy="cof-form-name"
                      >
                        {inputProps => (
                          <Field as={StyledInput} {...inputProps} placeholder={intl.formatMessage(placeholders.name)} />
                        )}
                      </StyledInputField>
                      <StyledInputField
                        name="slug"
                        htmlFor="slug"
                        error={touched.slug && errors.slug}
                        label={intl.formatMessage(orgMessages.slugLabel)}
                        labelFontSize="13px"
                        labelColor="black.700"
                        labelFontWeight="600"
                        fontSize="19px"
                        value={values.slug}
                        required
                        mt={3}
                        data-cy="cof-form-slug"
                      >
                        {inputProps => (
                          <Field
                            onChange={e => {
                              setFieldValue('slug', e.target.value);
                            }}
                            as={StyledInputGroup}
                            {...inputProps}
                            prepend="opencollective.com/"
                            placeholder={intl.formatMessage(placeholders.slug)}
                          />
                        )}
                      </StyledInputField>
                      {values.name.length > 0 && !touched.slug && (
                        <P fontSize="11px" mt={2} mb={2}>
                          {intl.formatMessage(orgMessages.suggestedLabel)}
                        </P>
                      )}
                      <StyledInputField
                        htmlFor="description"
                        error={touched.description && errors.description}
                        label={intl.formatMessage(orgMessages.descriptionLabel)}
                        labelFontSize="13px"
                        labelColor="black.700"
                        labelFontWeight="600"
                        fontSize="13px"
                        required
                        mt={3}
                        data-cy="cof-org-description"
                      >
                        {inputProps => (
                          <Field
                            as={StyledTextarea}
                            onChange={e => {
                              setFieldValue('description', e.target.value);
                            }}
                            {...inputProps}
                            name="description"
                            minHeight={80}
                            maxHeight={80}
                            minLength={5}
                            maxLength={150}
                            width="100%"
                            value={values.description}
                            placeholder={intl.formatMessage(orgMessages.descriptionPlaceholder)}
                          />
                        )}
                      </StyledInputField>
                      <P fontSize="11px" mt={2} mb={2}>
                        {intl.formatMessage(orgMessages.descriptionHint)}
                      </P>
                      <StyledInputField
                        name="website"
                        htmlFor="website"
                        error={touched.website && errors.website}
                        label={intl.formatMessage(orgMessages.websiteLabel)}
                        labelFontSize="13px"
                        labelColor="black.700"
                        labelFontWeight="600"
                        value={values.website}
                        required={false}
                        mt={3}
                        mb={2}
                        data-cy="cof-org-website"
                      >
                        {inputProps => (
                          <Field
                            onChange={e => {
                              setFieldValue('website', e.target.value);
                            }}
                            as={StyledInputGroup}
                            {...inputProps}
                            prepend="https://"
                            placeholder={intl.formatMessage(placeholders.website)}
                          />
                        )}
                      </StyledInputField>
                    </Flex>
                    <Flex flexDirection="column" maxWidth={[320, 350, 472]} mt={[3, 0]} mx={[1, 10, 10]}>
                      <H4 color="black.900" fontSize="18px" mb={[3, 1]}>
                        <FormattedMessage id="administrators" defaultMessage="Administrators" />
                      </H4>
                      <P fontSize="14px" mb={3} mt={2} lineHeight="21px" color="black.700">
                        <FormattedMessage
                          id="coAdminsDescription"
                          defaultMessage="Organization admins can make changes and represent this organization on the platform."
                        />
                      </P>
                      <Container border="1px solid #E6E8EB" borderRadius="16px" p={3} height="auto">
                        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
                          <Flex mr={2}>
                            <P fontSize="9px" color="black.700" fontWeight="500" textTransform="uppercase">
                              <FormattedMessage id="Admins" defaultMessage="Admins" />
                            </P>
                          </Flex>
                          <StyledHr flex="1" borderStyle="solid" borderColor="black.300" width={[100, 110, 120]} />
                        </Flex>
                        <Flex data-cy="org-profile-card" mt={2}>
                          {admins.length > 0 && (
                            <Flex width="100%" flexWrap="wrap">
                              {admins.map(admin => (
                                <OnboardingProfileCard
                                  key={admin.member.id}
                                  collective={admin.member}
                                  adminCollective={LoggedInUser.collective}
                                  removeAdmin={removeAdmin}
                                />
                              ))}
                            </Flex>
                          )}
                        </Flex>
                        <Flex flexDirection="row" alignItems="center" justifyContent="space-around" mt={4}>
                          <Flex mr={2}>
                            <P fontSize="9px" color="black.700" fontWeight="500" textTransform="uppercase">
                              <FormattedMessage id="inviteAdmin" defaultMessage="Invite co-admin" />
                            </P>
                          </Flex>
                          <StyledHr flex="1" borderStyle="solid" borderColor="black.300" width={[100, 110, 120]} />
                        </Flex>
                        <CollectivePickerAsync
                          inputId="admin-picker-org"
                          mt={2}
                          creatable
                          collective={null}
                          types={['USER']}
                          data-cy="admin-picker-org"
                          value="pp"
                          onChange={option => {
                            const duplicates = admins.filter(admin => admin.member.id === option.value.id);
                            setAdmins(
                              duplicates.length ? admins : [...admins, { role: 'ADMIN', member: option.value }],
                            );
                          }}
                          placeholder={intl.formatMessage(placeholders.username)}
                        />
                      </Container>
                    </Flex>
                  </Container>

                  <Flex
                    flexDirection="column"
                    my={4}
                    mx={2}
                    maxWidth={[320, 350, 450]}
                    color="black.800"
                    letterSpacing="0.2px"
                  >
                    <StyledCheckbox
                      name="authorization"
                      required
                      fontSize="12px"
                      label={
                        <FormattedMessage
                          id="createorganization.authorization.label"
                          defaultMessage="I verify that I am authorized to represent this organization."
                        />
                      }
                      onChange={({ checked }) => {
                        setAuthorization(checked);
                      }}
                    />
                    <Flex justifyContent={['center', 'left']} my={4}>
                      <StyledButton
                        fontSize="13px"
                        minWidth="148px"
                        minHeight="36px"
                        buttonStyle="primary"
                        type="submit"
                        loading={loading}
                        onSubmit={handleSubmit}
                        data-cy="cof-form-submit"
                      >
                        <FormattedMessage id="organization.create" defaultMessage="Create Organization" />
                      </StyledButton>
                    </Flex>
                  </Flex>
                </Box>
              </Flex>
            </Form>
          );
        }}
      </Formik>
    </Flex>
  );
};

CreateOrganizationForm.propTypes = {
  collective: PropTypes.object,
  LoggedInUser: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func,
  updateAdmins: PropTypes.func,
  intl: PropTypes.object.isRequired,
};
export default injectIntl(withRouter(withUser(CreateOrganizationForm)));
