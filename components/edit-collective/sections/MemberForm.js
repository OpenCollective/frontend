import React from 'react';
import PropTypes from 'prop-types';
import { Form, Formik } from 'formik';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import roles from '../../../lib/constants/roles';
import formatMemberRole from '../../../lib/i18n/member-role';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import InputField from '../../InputField';
import MemberRoleDescription, { hasRoleDescription } from '../../MemberRoleDescription';
import { P } from '../../Text';

const MemberContainer = styled(Container)`
  border: 1px solid #dcdee0;
  border-radius: 10px;
  max-width: 250px;
  padding: 16px;
`;

const memberFormMessages = defineMessages({
  roleLabel: { id: 'members.role.label', defaultMessage: 'Role' },
  sinceLabel: { id: 'user.since.label', defaultMessage: 'Since' },
  descriptionLabel: { id: 'Fields.description', defaultMessage: 'Description' },
});

const MemberForm = props => {
  const { intl, member, collectiveImg, bindSubmitForm, triggerSubmit } = props;

  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [memberRole, setMemberRole] = React.useState(member?.role || roles.ADMIN);

  const memberCollective = member?.member;

  const initialValues = {
    description: get(member, 'description') || '',
    role: get(member, 'role') || roles.ADMIN,
    since: get(member, 'since') ? new Date(get(member, 'since')).toISOString() : new Date(),
  };

  const submit = values => {
    if (!isSubmitted) {
      triggerSubmit(values);
      setIsSubmitted(true);
    }
  };

  const getOptions = arr => {
    return arr.map(key => {
      const obj = {};
      obj[key] = formatMemberRole(intl, key);
      return obj;
    });
  };

  const fields = [
    {
      name: 'role',
      type: 'select',
      options: getOptions([roles.ADMIN, roles.MEMBER, roles.ACCOUNTANT]),
      defaultValue: roles.ADMIN,
      label: intl.formatMessage(memberFormMessages.roleLabel),
    },
    {
      name: 'description',
      maxLength: 255,
      label: intl.formatMessage(memberFormMessages.descriptionLabel),
    },
    {
      name: 'since',
      type: 'date',
      defaultValue: new Date(),
      label: intl.formatMessage(memberFormMessages.sinceLabel),
    },
  ];

  return (
    <Flex flexDirection="column" justifyContent="center">
      {member && (
        <MemberContainer mb={2} mt={2}>
          <Flex>
            <Container position="relative">
              <Avatar src={get(memberCollective, 'imageUrl')} radius={48} />
              <Container mt={13} position="absolute" bottom="-10%" right="-10%">
                <Avatar type={CollectiveType.COLLECTIVE} backgroundColor="#ffffff" src={collectiveImg} radius={20} />
              </Container>
            </Container>
            <Box mx={10}>
              <P fontSize="16px" lineHeight="24px" fontWeight={500}>
                {get(memberCollective, 'name')}
              </P>
              <P fontSize="13px" lineHeight="20px" color="#4E5052" fontWeight={400}>
                {formatMemberRole(intl, get(member, 'role'))}
              </P>
            </Box>
          </Flex>
        </MemberContainer>
      )}
      <Formik initialValues={initialValues} onSubmit={submit}>
        {formik => {
          const { setFieldValue, submitForm } = formik;

          bindSubmitForm(submitForm);

          return (
            <Form>
              {fields.map(field => (
                <Container key={field.name}>
                  <InputField
                    name={field.name}
                    id={field.name}
                    label={field.label}
                    type={field.type}
                    disabled={false}
                    defaultValue={get(member, field.name) || field.defaultValue}
                    options={field.options}
                    onChange={value => {
                      setFieldValue(field.name, value);
                      if (field.name === 'role') {
                        setMemberRole(value);
                      }
                    }}
                  />
                  {field.name === 'role' && hasRoleDescription(memberRole) && (
                    <Flex mb={3}>
                      <Box mx={1} mt={1} fontSize="12px" color="black.600" fontStyle="italic">
                        <MemberRoleDescription role={memberRole} />
                      </Box>
                    </Flex>
                  )}
                </Container>
              ))}
            </Form>
          );
        }}
      </Formik>
    </Flex>
  );
};

MemberForm.propTypes = {
  bindSubmitForm: PropTypes.func,
  collectiveImg: PropTypes.string,
  intl: PropTypes.object.isRequired,
  member: PropTypes.object,
  triggerSubmit: PropTypes.func,
};

export default injectIntl(MemberForm);
