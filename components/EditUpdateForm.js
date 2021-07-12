import React from 'react';
import PropTypes from 'prop-types';
import { get, pick } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { toIsoDateStr } from '../lib/date-utils';
import storage from '../lib/storage';

import Container from './Container';
import { Box } from './Grid';
import RichTextEditor from './RichTextEditor';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';

const UpdateFormWrapper = styled(Container)`
  width: 100%;
`;

const ActionButtonWrapper = styled(Container)`
  @media (max-width: 600px) {
    justify-content: center;
  }
`;

class EditUpdateForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    update: PropTypes.object,
    isChangelog: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func,
    onChange: PropTypes.func,
    mode: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.tryUpdateDate = this.tryUpdateDate.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      modified: false,
      update: props.update ? pick(props.update, 'title', 'html', 'isPrivate', 'makePublicOn') : {},
      loading: false,
      error: '',
    };

    this.storageKey = `EditUpdateForm#${get(this.props, 'update.id') || get(this.props, 'collective.slug')}`;
  }

  componentDidMount() {
    const savedState = storage.get(this.storageKey);
    if (savedState && !this.props.update) {
      this.setState(savedState);
    }
    this._isMounted = true;
    this.forceUpdate();
  }

  tryUpdateDate(attr, value) {
    if (!value) {
      this.handleChange(attr, null);
    } else {
      const d = new Date(value).toISOString();
      this.handleChange(attr, d);
    }
  }

  handleChange(attr, value) {
    const update = {
      ...this.state.update,
      [attr]: value,
    };
    const newState = { modified: true, update };
    storage.set(this.storageKey, newState);
    this.setState(newState);
    this.props.onChange && this.props.onChange(update);
  }

  async onSubmit(e) {
    this.setState({ loading: true, error: '' });
    if (e) {
      e.preventDefault();
    }
    try {
      await this.props.onSubmit(this.state.update);
      this.setState({ modified: false, loading: false });
      storage.set(this.storageKey, null);
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
    return false;
  }

  render() {
    const { collective } = this.props;
    const { update } = this.state;
    if (!this._isMounted) {
      return <div />;
    }

    return (
      <UpdateFormWrapper className={`EditUpdateForm ${this.props.mode}`}>
        <form data-cy="edit-update-form" onSubmit={this.onSubmit}>
          <Container margin="auto 0">
            <Container width={1}>
              <Container mb={2} mt={2} fontWeight="500" fontSize="1.6rem" lineHeight="1.7">
                <Box as="span">Title</Box>
              </Container>
              <StyledInputField htmlFor="title">
                {inputProps => (
                  <StyledInput
                    {...inputProps}
                    type="text"
                    value={update.title}
                    onChange={e => this.handleChange('title', e.target.value)}
                    width="100%"
                    maxWidth="40em"
                    placeHolder="Normal"
                    maxLength={250}
                    data-cy="titleInput"
                    required
                  />
                )}
              </StyledInputField>
            </Container>
          </Container>
          <Container width={1}>
            <Container fontWeight="500" mb={2} mt={3} fontSize="1.6rem" lineHeight="1.7">
              <Box as="span">Message</Box>
            </Container>
            <RichTextEditor
              onChange={e => this.handleChange('html', e.target.value)}
              defaultValue={update.html}
              editorMinHeight={300}
              editorMaxHeight={600}
              withBorders
              data-cy="update-content-editor"
              videoEmbedEnabled
            />
          </Container>
          {(!collective.isHost || update.isPrivate) && !this.props.isChangelog && (
            <Container
              mt={3}
              mb={2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              minHeight={75}
              flexWrap="wrap"
            >
              {!collective.isHost && (
                <div>
                  <StyledCheckbox
                    defaultChecked={update.isPrivate}
                    name="private"
                    size="16px"
                    label="Private update"
                    onChange={isPrivate => this.handleChange('isPrivate', isPrivate.checked)}
                  />
                  <Container ml="25px" fontSize="12px" color="#71757A" mt={1}>
                    <FormattedMessage
                      id="update.private.description"
                      defaultMessage="Only contributors will be able to see the content of this update"
                    />
                  </Container>
                </div>
              )}
              {update.isPrivate && (
                <Box ml={2}>
                  <Container
                    as="label"
                    htmlFor="makePublicOn"
                    fontWeight="normal"
                    fontSize="14px"
                    color="black.900"
                    mb={2}
                  >
                    <FormattedMessage
                      id="update.makePublicOn.label"
                      defaultMessage="Automatically make public on this date"
                    />
                  </Container>
                  <StyledInputField htmlFor="makePublicOn">
                    {inputProps => (
                      <StyledInput
                        {...inputProps}
                        type="date"
                        defaultValue={update.makePublicOn ? toIsoDateStr(new Date(update.makePublicOn)) : ''}
                        onChange={e => this.tryUpdateDate('makePublicOn', e.target.value)}
                        width="100%"
                        maxWidth="40em"
                      />
                    )}
                  </StyledInputField>
                </Box>
              )}
            </Container>
          )}

          <ActionButtonWrapper mx={2} my={4}>
            <StyledButton
              data-cy="edit-update-submit-btn"
              className="bluewhite"
              buttonSize="large"
              buttonStyle="primary"
              type="submit"
              disabled={this.state.loading || !this.state.update.title || !this.state.update.html}
            >
              {this.state.loading && <FormattedMessage id="form.processing" defaultMessage="processing" />}
              {!this.state.loading &&
                (this.props.update?.publishedAt ? (
                  <FormattedMessage id="save" defaultMessage="Save" />
                ) : (
                  <FormattedMessage id="update.new.preview" defaultMessage="Preview Update" />
                ))}
            </StyledButton>
          </ActionButtonWrapper>

          <Container margin="auto 0">
            <Container width={1}>
              {this.state.error && <Container style={{ color: 'red' }}>{this.state.error}</Container>}
            </Container>
          </Container>
        </form>
      </UpdateFormWrapper>
    );
  }
}

export default EditUpdateForm;
