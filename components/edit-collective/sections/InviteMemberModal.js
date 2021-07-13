import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

import MemberForm from './MemberForm';
import { coreContributorsQuery } from './Members';

const inviteMemberMutation = gqlV2/* GraphQL */ `
  mutation InviteMember(
    $memberAccount: AccountReferenceInput!
    $account: AccountReferenceInput!
    $role: MemberRole!
    $description: String
    $since: DateTime
  ) {
    inviteMember(
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

const InviteMemberModal = props => {
  const { intl, show, collective, membersIds, cancelHandler } = props;

  const { addToast } = useToasts();

  const [member, setMember] = React.useState(null);
  const mutationOptions = {
    context: API_V2_CONTEXT,
    refetchQueries: [{ query: coreContributorsQuery, variables: { collectiveId: get(collective, 'id') } }],
    awaitRefetchQueries: true,
  };

  const [inviteMemberAccount, { loading: isInviting, error: inviteError }] = useMutation(
    inviteMemberMutation,
    mutationOptions,
  );

  let submitMemberForm = null;

  const bindSubmitForm = submitForm => {
    submitMemberForm = submitForm;
  };

  const handleInviteMemberMutation = async values => {
    const { description, role, since } = values;

    try {
      await inviteMemberAccount({
        variables: {
          memberAccount: {
            slug: get(member, 'slug'),
          },
          account: { slug: get(collective, 'slug') },
          description,
          role,
          since,
          isInvitee: true,
        },
      });

      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: <FormattedMessage id="editTeam.member.invite.success" defaultMessage="Member invited successfully." />,
      });

      cancelHandler();
    } catch (error) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: <FormattedMessage id="editTeam.member.invite.error" defaultMessage="Failed to invite member." />,
      });
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
        <ModalHeader mb={4}>
          <FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />
        </ModalHeader>
        <ModalBody>
          {inviteError && (
            <Flex alignItems="center" justifyContent="center">
              <MessageBox type="error" withIcon m={[1, 3]} data-cy="cof-error-message">
                {inviteError.message}
              </MessageBox>
            </Flex>
          )}
          <Flex m={1} flexDirection="column" mb={2}>
            <P fontSize="14px" lineHeight="20px" fontWeight={700} mb={1}>
              <FormattedMessage id="Tags.USER" defaultMessage="User" />
            </P>
            <CollectivePickerAsync
              inputId="member-collective-picker"
              creatable
              width="100%"
              minWidth={325}
              maxWidth={450}
              onChange={option => setMember(option.value)}
              isDisabled={Boolean(member)}
              types={[CollectiveType.USER]}
              filterResults={collectives => collectives.filter(c => !membersIds.includes(c.id))}
              data-cy="member-collective-picker"
            />
          </Flex>
          <MemberForm
            intl={intl}
            collectiveImg={get(collective, 'imageUrl')}
            bindSubmitForm={bindSubmitForm}
            triggerSubmit={handleInviteMemberMutation}
          />
        </ModalBody>
        <ModalFooter mt={6}>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
            <StyledButton
              mx={20}
              my={1}
              autoFocus
              minWidth={140}
              onClick={cancelHandler}
              disabled={isInviting}
              data-cy="confirmation-modal-cancel"
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              my={1}
              minWidth={140}
              buttonStyle="primary"
              data-cy="confirmation-modal-continue"
              loading={isInviting}
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

InviteMemberModal.propTypes = {
  collective: PropTypes.object,
  cancelHandler: PropTypes.func,
  intl: PropTypes.object.isRequired,
  membersIds: PropTypes.array,
  show: PropTypes.bool,
};

export default InviteMemberModal;
