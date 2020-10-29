import React from 'react';
import PropTypes from 'prop-types';
import { groupBy, intersection, isEqual, last, sortBy, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import ReactDOM from 'react-dom';
import { defineMessages, injectIntl } from 'react-intl';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { isEmail } from 'validator';

import { CollectiveType } from '../lib/constants/collectives';
import { mergeRefs } from '../lib/react-utils';

import Avatar from './Avatar';
import { InviteCollectiveDropdownOption, InviteCollectiveForm } from './CollectivePickerInviteMenu';
import CollectiveTypePicker from './CollectiveTypePicker';
import Container from './Container';
import CreateCollectiveMiniForm from './CreateCollectiveMiniForm';
import { Flex } from './Grid';
import StyledCard from './StyledCard';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

const CollectiveTypesI18n = defineMessages({
  [CollectiveType.COLLECTIVE]: {
    id: 'collective.types.collective',
    defaultMessage: '{n, plural, one {collective} other {collectives}}',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'collective.types.organization',
    defaultMessage: '{n, plural, one {organization} other {organizations}}',
  },
  [CollectiveType.USER]: {
    id: 'collective.types.user',
    defaultMessage: '{n, plural, one {people} other {people}}',
  },
});

const Messages = defineMessages({
  createNew: {
    id: 'CollectivePicker.CreateNew',
    defaultMessage: 'Create new',
  },
  inviteNew: {
    id: 'CollectivePicker.InviteNew',
    defaultMessage: 'Invite new',
  },
});

const CollectiveLabelTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  margin-left: 8px;
`;

/**
 * Default label builder used to render a collective. For sections titles and custom options,
 * this will just return the default label.
 */
export const DefaultCollectiveLabel = ({ value: collective }) => (
  <Flex alignItems="center">
    <Avatar collective={collective} radius={28} />
    <CollectiveLabelTextContainer>
      <Span fontSize="12px" fontWeight="500" lineHeight="18px" color="black.700">
        {truncate(collective.name, { length: 40 })}
      </Span>
      <Span fontSize="11px" lineHeight="13px" color="black.500">
        {collective.isInvite ? collective.email : `@${collective.slug}`}
      </Span>
    </CollectiveLabelTextContainer>
  </Flex>
);

DefaultCollectiveLabel.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    imageUrl: PropTypes.string,
  }),
};

// Some flags to differentiate options in the picker
export const FLAG_COLLECTIVE_PICKER_COLLECTIVE = '__collective_picker_collective__';
const FLAG_NEW_COLLECTIVE = '__collective_picker_new__';
const FLAG_INVITE_NEW = '__collective_picker_invite_new__';

export const CUSTOM_OPTIONS_POSITION = {
  TOP: 'TOP',
  BOTTOM: 'BOTTOM',
};

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const sortedAccountTypes = ['INDIVIDUAL', USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT];

/**
 * An overset og `StyledSelect` specialized to display, filter and pick a collective from a given list.
 * Accepts all the props from [StyledSelect](#!/StyledSelect).
 *
 * If you want the collectives to be automatically loaded from the API, check `CollectivePickerAsync`.
 */
class CollectivePicker extends React.PureComponent {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.state = {
      createFormCollectiveType: null,
      displayInviteMenu: null,
      menuIsOpen: props.menuIsOpen,
      createdCollectives: [],
      searchText: '',
    };
  }

  /**
   * Function to generate a single select option
   */
  buildCollectiveOption(collective) {
    if (collective === null) {
      return null;
    } else {
      return { value: collective, label: collective.name, [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true };
    }
  }

  /**
   * From a collectives list, returns a list of options that can be provided to a `StyledSelect`.
   *
   * @param {Array|null} collectives
   * @param {Boolean} groupByType
   * @param {function} sortFunc
   * @param {object} intl
   */
  getOptionsFromCollectives = memoizeOne((collectives, groupByType, sortFunc, intl) => {
    if (!collectives || collectives.length === 0) {
      return [];
    }

    // If not grouped, just sort the collectives by names and return their options
    if (!groupByType) {
      return sortFunc(collectives).map(this.buildCollectiveOption);
    }

    // Group collectives under categories, sort the categories labels and the collectives inside them
    const collectivesByTypes = groupBy(collectives, 'type');
    const sortedActiveTypes = intersection(sortedAccountTypes, Object.keys(collectivesByTypes));

    return sortedActiveTypes.map(type => {
      const sectionI18n = CollectiveTypesI18n[type];
      const sortedCollectives = sortFunc(collectivesByTypes[type]);
      const sectionLabel = sectionI18n ? intl.formatMessage(sectionI18n, { n: sortedCollectives.length }) : type;
      return {
        label: sectionLabel || '',
        options: sortedCollectives.map(this.buildCollectiveOption),
      };
    });
  });

  getAllOptions = memoizeOne((collectivesOptions, customOptions, createdCollectives) => {
    const { creatable, invitable, intl, customOptionsPosition } = this.props;
    let options = collectivesOptions;

    if (createdCollectives.length > 0) {
      options = [...createdCollectives.map(this.buildCollectiveOption), ...options];
    }

    if (customOptions && customOptions.length > 0) {
      options =
        customOptionsPosition === CUSTOM_OPTIONS_POSITION.TOP
          ? [...customOptions, ...options]
          : [...options, ...customOptions];
    }

    if (invitable) {
      options = [
        ...options,
        {
          label: intl.formatMessage(Messages.inviteNew).toUpperCase(),
          options: [
            {
              label: null,
              value: null,
              isDisabled: true,
              [FLAG_INVITE_NEW]: true,
              __background__: 'white',
            },
          ],
        },
      ];
    }
    if (creatable) {
      const isOnlyForUser = isEqual(this.props.types, [CollectiveType.USER]);
      options = [
        ...options,
        {
          label: isOnlyForUser
            ? intl.formatMessage(Messages.inviteNew).toUpperCase()
            : intl.formatMessage(Messages.createNew).toUpperCase(),
          options: [
            {
              label: null,
              value: null,
              isDisabled: true,
              [FLAG_NEW_COLLECTIVE]: true,
              __background__: 'white',
            },
          ],
        },
      ];
    }

    return options;
  });

  onChange = e => {
    this.props.onChange(e);
    if (this.state.showCreatedCollective) {
      this.setState({ showCreatedCollective: false });
    }
  };

  onInputChange = newTerm => {
    this.props.onInputChange?.(newTerm);
    this.setState({ searchText: newTerm });
  };

  setCreateFormCollectiveType = type => {
    this.setState({ createFormCollectiveType: type || null });
  };

  setDisplayInviteMenu = isOpen => {
    this.setState({ displayInviteMenu: isOpen || null, menuIsOpen: !isOpen });
  };

  getMenuIsOpen(menuIsOpenFromProps) {
    if (this.state.createFormCollectiveType || this.props.isDisabled) {
      return false;
    } else if (typeof menuIsOpenFromProps !== 'undefined') {
      return menuIsOpenFromProps;
    } else {
      return this.state.menuIsOpen;
    }
  }

  openMenu = () => this.setState({ menuIsOpen: true });

  closeMenu = () => this.setState({ menuIsOpen: false });

  getDefaultOption = (getDefaultOptionsFromProps, allOptions) => {
    if (this.state.createdCollective) {
      return this.buildCollectiveOption(this.state.createdCollective);
    } else if (getDefaultOptionsFromProps) {
      return getDefaultOptionsFromProps(this.buildCollectiveOption, allOptions);
    }
  };

  getValue = () => {
    if (this.props.collective !== undefined) {
      return this.buildCollectiveOption(this.props.collective);
    } else if (this.state.showCreatedCollective) {
      return this.buildCollectiveOption(last(this.state.createdCollectives));
    } else {
      return this.props.getOptions(this.buildCollectiveOption);
    }
  };

  render() {
    const {
      intl,
      collectives,
      customOptions,
      formatOptionLabel,
      getDefaultOptions,
      groupByType,
      onChange,
      sortFunc,
      types,
      isDisabled,
      menuIsOpen,
      minWidth,
      maxWidth,
      width,
      addLoggedInUserAsAdmin,
      ...props
    } = this.props;
    const { createFormCollectiveType, createdCollectives, displayInviteMenu, searchText } = this.state;
    const collectiveOptions = this.getOptionsFromCollectives(collectives, groupByType, sortFunc, intl);
    const allOptions = this.getAllOptions(collectiveOptions, customOptions, createdCollectives);

    const prefillValue = isEmail(searchText) ? { email: searchText } : { name: searchText };

    return (
      <Manager>
        <Reference>
          {({ ref }) => (
            <Container
              position="relative"
              minWidth={minWidth}
              maxWidth={maxWidth}
              width={width}
              ref={mergeRefs([this.containerRef, ref])}
            >
              <StyledSelect
                options={allOptions}
                defaultValue={getDefaultOptions && getDefaultOptions(this.buildCollectiveOption, allOptions)}
                menuIsOpen={this.getMenuIsOpen(menuIsOpen)}
                isDisabled={Boolean(createFormCollectiveType) || displayInviteMenu || isDisabled}
                onMenuOpen={this.openMenu}
                onMenuClose={this.closeMenu}
                value={this.getValue()}
                onChange={this.onChange}
                formatOptionLabel={(option, context) => {
                  if (option[FLAG_COLLECTIVE_PICKER_COLLECTIVE]) {
                    return formatOptionLabel(option, context);
                  } else if (option[FLAG_NEW_COLLECTIVE]) {
                    return <CollectiveTypePicker onChange={this.setCreateFormCollectiveType} types={types} />;
                  } else if (option[FLAG_INVITE_NEW]) {
                    return (
                      <InviteCollectiveDropdownOption
                        onClick={() => {
                          this.setDisplayInviteMenu(true);
                          onChange?.({ label: null, value: null });
                        }}
                      />
                    );
                  } else {
                    return option.label;
                  }
                }}
                {...props}
                onInputChange={this.onInputChange}
              />
            </Container>
          )}
        </Reference>
        {(createFormCollectiveType || displayInviteMenu) &&
          ReactDOM.createPortal(
            <Popper placement="bottom">
              {({ placement, ref, style }) => (
                <div
                  data-placement={placement}
                  ref={ref}
                  style={{
                    ...style,
                    width: this.containerRef.current.clientWidth,
                    zIndex: 9999,
                  }}
                >
                  <StyledCard
                    p={3}
                    my={1}
                    boxShadow="-2px 4px 7px 0 rgba(78, 78, 78, 14%)"
                    maxHeight={315}
                    overflowY="auto"
                    {...this.props.styles?.menu}
                  >
                    {createFormCollectiveType && (
                      <CreateCollectiveMiniForm
                        type={createFormCollectiveType}
                        onCancel={this.setCreateFormCollectiveType}
                        addLoggedInUserAsAdmin={addLoggedInUserAsAdmin}
                        optionalFields={this.props.createCollectiveOptionalFields}
                        onSuccess={collective => {
                          if (onChange) {
                            onChange({ label: collective.name, value: collective });
                          }
                          this.setState(state => ({
                            menuIsOpen: false,
                            createFormCollectiveType: null,
                            createdCollectives: [...state.createdCollectives, collective],
                            showCreatedCollective: true,
                          }));
                        }}
                        {...prefillValue}
                      />
                    )}
                    {displayInviteMenu && (
                      <InviteCollectiveForm
                        onSave={value => {
                          onChange?.({ label: value.name, value });
                          this.setState({ displayInviteMenu: false });
                        }}
                        onCancel={() => {
                          this.setState({ displayInviteMenu: false });
                        }}
                      />
                    )}
                  </StyledCard>
                </div>
              )}
            </Popper>,
            document.body,
          )}
      </Manager>
    );
  }
}

CollectivePicker.propTypes = {
  /** The list of collectives to display */
  collectives: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      type: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  /** Custom options to be passed to styled select */
  customOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      value: PropTypes.any,
    }),
  ),
  /** Defines if custom options are listed in the top of the list or the bottom */
  customOptionsPosition: PropTypes.oneOf(CUSTOM_OPTIONS_POSITION),
  /** Function to sort collectives. Default to sorty by name */
  sortFunc: PropTypes.func,
  /** Called when value changes */
  onChange: PropTypes.func.isRequired,
  /** Called when search input text changes  */
  onInputChange: PropTypes.func,
  /** Get passed the options list, returns the default one */
  getDefaultOptions: PropTypes.func.isRequired,
  /** Use this to control the component */
  getOptions: PropTypes.func.isRequired,
  /** Function to generate a label from the collective + index */
  formatOptionLabel: PropTypes.func.isRequired,
  /** Whether we should group collectives by type */
  groupByType: PropTypes.bool,
  /** If true, a permanent option to create a collective will be displayed in the select */
  creatable: PropTypes.bool,
  /** If true, a permanent option to invite a new user will be displayed in the select */
  invitable: PropTypes.bool,
  /** If true, logged in user will be added as an admin of the created account */
  addLoggedInUserAsAdmin: PropTypes.bool,
  /** Force menu to be open. Ignored during collective creation */
  menuIsOpen: PropTypes.bool,
  /** Disabled */
  isDisabled: PropTypes.bool,
  /** Component min width */
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Component max width */
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Component width */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** If creatable is true, only these types will be displayed in the create form */
  types: PropTypes.arrayOf(PropTypes.oneOf(Object.values(CollectiveType))),
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  /** Use this to control the value of the component */
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
  }),
  /** A list of optional fields to include in the form */
  createCollectiveOptionalFields: PropTypes.array,
  /** StyledSelect pass-through property */
  styles: PropTypes.object,
};

CollectivePicker.defaultProps = {
  groupByType: true,
  getDefaultOptions: () => undefined,
  getOptions: () => undefined,
  formatOptionLabel: DefaultCollectiveLabel,
  sortFunc: collectives => sortBy(collectives, 'name'),
};

export default injectIntl(CollectivePicker);
