import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Delete } from '@styled-icons/material/Delete';
import { get } from 'lodash';
import { defineMessages, FormattedMessage } from 'react-intl';

import roles from '../../../lib/constants/roles';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import StyledTooltip from '../../StyledTooltip';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import MemberForm from './MemberForm';
import { coreContributorsQuery } from './Members';

const editMemberMutation = gqlV2/* GraphQL */ `
  mutation EditMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $description: String
    $since: DateTime
  ) {
    editMember(
      memberAccount: $memberAccount
      account: $account
      role: $role
      description: $description
      since: $since
    ) {
      id
    }
  }
`;

const editMemberInvitationMutation = gqlV2/* GraphQL */ `
  mutation EditMemberInvitation(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole
    $description: String
    $since: DateTime
  ) {
    editMemberInvitation(
      memberAccount: $memberAccount
      account: $account
      role: $role
      description: $description
      since: $since
    ) {
      id
    }
  }
`;

const removeMemberMutation = gqlV2/* GraphQL */ `
  mutation RemoveMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole!
    $isInvitation: Boolean
  ) {
    removeMember(memberAccount: $memberAccount, account: $account, role: $role, isInvitation: $isInvitation)
  }
`;

const EditMemberModal = props => {
  const { intl, member, show, collective, isLastAdmin, cancelHandler } = props;

  const { addToast } = useToasts();

  const isInvitation = get(member, '__typename') === 'MemberInvitation';

  const messages = defineMessages({
    cantRemoveLast: {
      id: 'members.remove.cantRemoveLast',
      defaultMessage: 'The last admin cannot be removed. Please add another admin first.',
    },
    removeConfirm: {
      id: 'members.remove.confirm',
      defaultMessage: `Do you really want to remove {name} @{slug} {hasEmail, select, 1 {({email})} other {}}?`,
    },
  });

  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: coreContributorsQuery, variables: { collectiveId: get(collective, 'id') } }],
    awaitRefetchQueries: true,
  };

  const [editMemberAccount, { loading: isEditingMember, error: editError }] = useMutation(
    editMemberMutation,
    mutationOptions,
  );

  const [editMemberInvitationAccount, { loading: isEditingMemberInvitation, error: editMemberInvitationError }] =
    useMutation(editMemberInvitationMutation, mutationOptions);

  const [removeMemberAccount, { error: removeError }] = useMutation(removeMemberMutation, mutationOptions);

  let submitMemberForm = null;

  const bindSubmitForm = submitForm => {
    submitMemberForm = submitForm;
  };

  const handleEditMemberMutation = async values => {
    const { description, role, since } = values;

    try {
      await editMemberAccount({
        variables: {
          memberAccount: {
            slug: get(member.member, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="editTeam.member.edit.success" defaultMessage="Member updated successfully." />,
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: <FormattedMessage id="editTeam.member.edit.error" defaultMessage="Failed to update member." />,
      });
    }
  };

  const handleEditMemberInvitationMutation = async values => {
    const { description, role, since } = values;

    try {
      await editMemberInvitationAccount({
        variables: {
          memberAccount: {
            slug: get(member.member, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: (
          <FormattedMessage
            id="editTeam.memberInvitation.edit.success"
            defaultMessage="Member invitation updated successfully."
          />
        ),
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: (
          <FormattedMessage
            id="editTeam.memberInvitation.edit.error"
            defaultMessage="Failed to update member invitation."
          />
        ),
      });
    }
  };

  const confirmRemoveMember = memberEntry => {
    return window.confirm(
      intl.formatMessage(messages.removeConfirm, {
        ...memberEntry.member,
        hasEmail: Number(memberEntry.member.email),
      }),
    );
  };

  const handleRemoveMemberMutation = async () => {
    if (confirmRemoveMember(member)) {
      try {
        await removeMemberAccount({
          variables: {
            memberAccount: {
              slug: get(member.member, 'slug'),
            },
            account: { slug: get(collective, 'slug') },
            role: get(member, 'role'),
            isInvitation,
          },
        });

        addToast({
          type: TOAST_TYPE.SUCCESS,
          message: (
            <FormattedMessage id="editTeam.member.remove.success" defaultMessage="Member removed successfully." />
          ),
        });

        cancelHandler();
      } catch (error) {
        addToast({
          type: TOAST_TYPE.ERROR,
          message: <FormattedMessage id="editTeam.member.remove.error" defaultMessage="Failed to remove member." />,
        });
      }
    } else {
      cancelHandler();
    }
  };

  const handleSubmitForm = () => {
    if (submitMemberForm) {
      submitMemberForm();
    }
  };

  return (
    <Container>
      <Modal width={688} show={show} onClose={cancelHandler}>
        <ModalHeader>
          <FormattedMessage id="editTeam.member.edit" defaultMessage="Edit Team Member" />
        </ModalHeader>
        <ModalBody>
          {editError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {editError.message}
              </MessageBox>
            </Flex>
          )}
          {editMemberInvitationError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {editMemberInvitationError.message}
              </MessageBox>
            </Flex>
          )}
          {removeError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {removeError.message}
              </MessageBox>
            </Flex>
          )}
          <MemberForm
            intl={intl}
            collectiveImg={get(collective, 'imageUrl')}
            member={member}
            bindSubmitForm={bindSubmitForm}
            triggerSubmit={isInvitation ? handleEditMemberInvitationMutation : handleEditMemberMutation}
          />
          <Flex justifyContent="flex-end">
            {isLastAdmin && member.role === roles.ADMIN ? (
              <StyledTooltip place="bottom" content={() => intl.formatMessage(messages.cantRemoveLast)}>
                <StyledButton
                  mt={4}
                  minWidth={140}
                  disabled={true}
                  buttonStyle="dangerSecondary"
                  data-cy="remove-member"
                  onClick={handleRemoveMemberMutation}
                >
                  <Flex alignItems="center">
                    <Delete height={25} />
                    <FormattedMessage id="members.remove" defaultMessage="Delete Member" />
                  </Flex>
                </StyledButton>
              </StyledTooltip>
            ) : (
              <StyledButton
                mt={4}
                minWidth={140}
                disabled={isLastAdmin && member.role === roles.ADMIN}
                buttonStyle="dangerSecondary"
                data-cy="remove-member"
                onClick={handleRemoveMemberMutation}
              >
                <Flex alignItems="center">
                  <Delete height={25} />
                  <FormattedMessage id="members.remove" defaultMessage="Delete Member" />
                </Flex>
              </StyledButton>
            )}
          </Flex>
        </ModalBody>
        <ModalFooter mt={5}>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              mx={20}
              my={1}
              autoFocus
              minWidth={140}
              onClick={cancelHandler}
              disabled={isEditingMember || isEditingMemberInvitation}
              data-cy="confirmation-modal-cancel"
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isEditingMember || isEditingMemberInvitation}
              onClick={handleSubmitForm}
            >
              <FormattedMessage id="save" defaultMessage="Save" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

EditMemberModal.propTypes = {
  collective: PropTypes.object,
  cancelHandler: PropTypes.func,
  intl: PropTypes.object.isRequired,
  isLastAdmin: PropTypes.bool,
  member: PropTypes.object,
  show: PropTypes.bool,
};

export default EditMemberModal;
