import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from '@apollo/client/react/components';
import { PencilAlt } from '@styled-icons/fa-solid/PencilAlt';
import { get, pick } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Container from './Container';
import { Box, Flex } from './Grid';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import { fadeIn } from './StyledKeyframes';
import StyledTextarea from './StyledTextarea';
import WarnIfUnsavedChanges from './WarnIfUnsavedChanges';

/** Container used to show the description to users than can edit it */
const EditIcon = styled(PencilAlt)`
  cursor: pointer;
  background-color: white;
  border: 1px solid #aaaeb3;
  border-radius: 25%;
  padding: 15%;
  color: #aaaeb3;

  &:hover {
    color: #8697ad;
  }
`;

/** Component used for cancel / submit buttons */
const FormButton = styled(StyledButton)`
  width: 35%;
  font-weight: normal;
  text-transform: capitalize;
  margin: 4px 8px;
  animation: ${fadeIn} 0.3s;
`;

const messages = defineMessages({
  warnDiscardChanges: {
    id: 'warning.discardUnsavedChanges',
    defaultMessage: 'Are you sure you want to discard your unsaved changes?',
  },
});

/**
 * A field that can be edited inline. Relies directly on GraphQL to handle errors and
 * loading states properly. By default this component will use `TextAreaAutosize`
 * but you can override this behaviour by passing a custom `children` prop.
 */
class InlineEditField extends Component {
  static propTypes = {
    /** Field name */
    field: PropTypes.string.isRequired,
    /** Object that holds the values */
    values: PropTypes.object.isRequired,
    /** The GraphQL mutation used to update this value */
    mutation: PropTypes.object.isRequired,
    /** Passed to Apollo */
    mutationOptions: PropTypes.object,
    /** Can user edit the description */
    canEdit: PropTypes.bool,
    /** Use this to control the component state */
    isEditing: PropTypes.bool,
    /** Add a confirm if trying to leave the form with unsaved changes */
    warnIfUnsavedChanges: PropTypes.bool,
    /** Max field length */
    maxLength: PropTypes.number,
    /** Gets passed the item, the new value and must return the mutation variables */
    prepareVariables: PropTypes.func,
    /** For cases when component is controlled */
    disableEditor: PropTypes.func,
    /** Set to false to disable edit icon even if user is allowed to edit */
    showEditIcon: PropTypes.bool,
    /** If given, this function will be used to render the field */
    children: PropTypes.func,
    /**
     * A text that will be rendered if user can edit and there's no value available.
     * Highly recommended if field is nullable.
     */
    placeholder: PropTypes.node,
    /** To set the min width of Cancel/Save buttons */
    buttonsMinWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Editing the top value. */
    topEdit: PropTypes.number,
    /** @ignore from injectIntl */
    intl: PropTypes.object.isRequired,
  };

  static defaultProps = {
    showEditIcon: true,
    buttonsMinWidth: 225,
    topEdit: -5,
  };

  state = { isEditing: false, draft: '' };

  componentDidUpdate(oldProps) {
    if (oldProps.isEditing !== this.props.isEditing) {
      if (this.props.isEditing) {
        this.setState({ isEditing: true, draft: get(this.props.values, this.props.field) });
      } else {
        this.setState({ isEditing: false });
      }
    }
  }

  enableEditor = () => {
    this.setState({ isEditing: true, draft: get(this.props.values, this.props.field) });
  };

  disableEditor = noWarning => {
    const { warnIfUnsavedChanges, intl, values, field } = this.props;
    if (!noWarning && warnIfUnsavedChanges) {
      const isDirty = get(values, field) !== this.state.draft;
      if (isDirty && !confirm(intl.formatMessage(messages.warnDiscardChanges))) {
        return;
      }
    }

    this.setState({ isEditing: false });

    if (this.props.disableEditor) {
      this.props.disableEditor();
    }
  };

  setDraft = draft => {
    this.setState({ draft });
  };

  renderContent(field, canEdit, value, placeholder, children) {
    if (children) {
      return children({
        value,
        isEditing: false,
        enableEditor: this.enableEditor,
        disableEditor: this.disableEditor,
        setValue: this.setDraft,
      });
    } else if (!value) {
      return canEdit && placeholder ? (
        <StyledButton buttonSize="large" onClick={this.enableEditor} data-cy={`InlineEditField-Add-${field}`}>
          {placeholder}
        </StyledButton>
      ) : null;
    } else {
      return <span>{value}</span>;
    }
  }

  render() {
    const {
      field,
      values,
      mutation,
      canEdit,
      prepareVariables,
      showEditIcon,
      placeholder,
      children,
      topEdit,
      mutationOptions,
      warnIfUnsavedChanges,
    } = this.props;
    const { draft, isEditing } = this.state;
    const { buttonsMinWidth } = this.props;
    const value = get(values, field);
    const isValid = draft !== value && draft !== '';

    if (!isEditing) {
      return (
        <Container position="relative">
          {canEdit && showEditIcon && (
            <Container position="absolute" top={topEdit} right={-5} zIndex={2}>
              <EditIcon size={24} onClick={this.enableEditor} data-cy={`InlineEditField-Trigger-${field}`} />
            </Container>
          )}
          {this.renderContent(field, canEdit, value, placeholder, children)}
        </Container>
      );
    } else {
      return (
        <WarnIfUnsavedChanges hasUnsavedChanges={warnIfUnsavedChanges && isValid}>
          <Mutation mutation={mutation} {...mutationOptions}>
            {(updateField, { loading, error }) => (
              <React.Fragment>
                {children ? (
                  children({
                    isEditing: true,
                    value: draft,
                    maxLength: this.props.maxLength,
                    setValue: this.setDraft,
                    enableEditor: this.enableEditor,
                    disableEditor: this.disableEditor,
                  })
                ) : (
                  <StyledTextarea
                    autoSize
                    autoFocus
                    width={1}
                    value={draft || ''}
                    onChange={e => this.setDraft(e.target.value)}
                    px={0}
                    py={0}
                    border="0"
                    letterSpacing="inherit"
                    fontSize="inherit"
                    fontWeight="inherit"
                    lineHeight="inherit"
                    maxLength={this.props.maxLength}
                    data-cy={`InlineEditField-Textarea-${field}`}
                    withOutline
                  />
                )}
                <Box width={1}>
                  {error && (
                    <MessageBox type="error" my={2} fontSize="14px" lineHeight="20px" fontWeight="normal" withIcon>
                      {error.message}
                    </MessageBox>
                  )}
                  <Flex flexWrap="wrap" justifyContent="space-evenly" mt={3}>
                    <FormButton
                      data-cy="InlineEditField-Btn-Cancel"
                      disabled={loading}
                      minWidth={buttonsMinWidth}
                      onClick={this.disableEditor}
                    >
                      <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                    </FormButton>
                    <FormButton
                      buttonStyle="primary"
                      loading={loading}
                      disabled={!isValid}
                      data-cy="InlineEditField-Btn-Save"
                      minWidth={buttonsMinWidth}
                      onClick={() => {
                        let variables;
                        if (prepareVariables) {
                          variables = prepareVariables(values, draft);
                        } else {
                          variables = pick(values, ['id']);
                          variables[field] = draft;
                        }
                        updateField({ variables }).then(() => this.disableEditor(true));
                      }}
                    >
                      <FormattedMessage id="save" defaultMessage="Save" />
                    </FormButton>
                  </Flex>
                </Box>
              </React.Fragment>
            )}
          </Mutation>
        </WarnIfUnsavedChanges>
      );
    }
  }
}

export default injectIntl(InlineEditField);
