import React from 'react';
import PropTypes from 'prop-types';
import { get, isNil } from 'lodash';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { capitalize } from '../lib/utils';

import { Box, Flex } from './Grid';
import InputSwitch from './InputSwitch';
import InputTypeCountry from './InputTypeCountry';
import InputTypeLocation from './InputTypeLocation';
import StyledButton from './StyledButton';
import StyledCheckbox from './StyledCheckbox';
import StyledInputGroup from './StyledInputGroup';
import StyledInputTags from './StyledInputTags';
import StyledSelect from './StyledSelect';
import StyledTextarea from './StyledTextarea';
import TimezonePicker from './TimezonePicker';

// Dynamic imports: this components have a huge impact on bundle size and are externalized
// We use the DYNAMIC_IMPORT env variable to skip dynamic while using Jest
let DateTime;
if (process.env.DYNAMIC_IMPORT) {
  DateTime = dynamic(() => import(/* webpackChunkName: 'DateTime' */ './DateTime'));
} else {
  DateTime = require('./DateTime').default;
}

function FieldGroup({ label, help, pre, post, after, button, className, ...props }) {
  const validationState = props.validationState === 'error' ? 'error' : null;
  delete props.validationState;

  props.key = props.key || props.name;

  const inputProps = { ...props };
  delete inputProps.children;

  if (className && className.match(/horizontal/)) {
    return (
      <Flex flexWrap="wrap" p={1}>
        <Box width={[1, 2 / 12]}>
          <label>{label}</label>
        </Box>
        <Box width={[1, 10 / 12]}>
          <StyledInputGroup
            prepend={pre}
            append={post}
            success={validationState}
            onWheel={e => {
              e.preventDefault();
              e.target.blur();
            }}
            {...inputProps}
          />
          {after && <div className="after">{after}</div>}
          {button && <StyledButton>{button}</StyledButton>}
          {help && <HelpBlock>{help}</HelpBlock>}
        </Box>
      </Flex>
    );
  } else {
    return (
      <Flex flexWrap="wrap" p={1}>
        {label && (
          <Box width={1}>
            <label>{label}</label>
          </Box>
        )}
        <Box width={1}>
          <StyledInputGroup
            prepend={pre}
            append={post}
            success={validationState}
            onWheel={e => {
              e.preventDefault();
              e.target.blur();
            }}
            {...inputProps}
          />
          {button && <StyledButton>{button}</StyledButton>}
        </Box>
        {help && <HelpBlock>{help}</HelpBlock>}
      </Flex>
    );
  }
}

const InputFieldContainer = styled.div`
  label {
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .horizontal label {
    padding-right: 15px;
    padding-left: 15px;
  }
`;

const HelpBlock = styled(Box)`
  color: #737373;
  font-size: 1.2rem;
`;

class InputField extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    description: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object, PropTypes.array]),
    defaultValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.object,
      PropTypes.bool,
      PropTypes.array,
    ]),
    validate: PropTypes.func,
    options: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.object]),
    context: PropTypes.object,
    placeholder: PropTypes.string,
    pre: PropTypes.string,
    post: PropTypes.string,
    button: PropTypes.node,
    className: PropTypes.string,
    type: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    required: PropTypes.bool,
    style: PropTypes.object,
    multiple: PropTypes.bool,
    closeOnSelect: PropTypes.bool,
    charCount: PropTypes.number,
    maxLength: PropTypes.number,
    step: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    disabled: PropTypes.bool,
    timeFormat: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    focus: PropTypes.bool,
    help: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { value: props.value, validationState: null };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      this.setState({ value: this.props.value });
    }
  }

  validate(value) {
    if (!value) {
      return !this.props.required;
    }
    const type = this.props.type || 'text';
    if (this.props.validate && !type.match(/^date/)) {
      return this.props.validate(value);
    }
    switch (this.props.type) {
      case 'email':
        return value.match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        );
    }
    return true;
  }

  roundCurrencyValue(value) {
    if (value === null) {
      return null;
    } else if (get(this.props.options, 'step') === 1) {
      // Value must be an increment of 1, truncate the two last digits
      return Math.trunc(value / 100) * 100;
    }
    return value;
  }

  handleChange(value) {
    const { type, step } = this.props;
    if (type === 'number') {
      const parsed = step && parseFloat(step) !== 1 ? parseFloat(value) : parseInt(value);
      value = isNaN(parsed) ? null : parsed;
    } else if (type === 'currency') {
      value = this.roundCurrencyValue(value);
    }

    if (this.validate(value)) {
      this.setState({ validationState: null });
    } else {
      this.setState({ validationState: 'error' });
    }

    this.setState({ value });
    this.props.onChange(value);
  }

  render() {
    const field = this.props;
    const context = field.context || {};
    let value = this.state.value;
    const horizontal = field.className && field.className.match(/horizontal/);
    switch (this.props.type) {
      case 'textarea': {
        value = value || this.props.defaultValue || '';
        let after;
        if (field.charCount) {
          if (field.maxLength) {
            after = `${field.maxLength - value.length} characters left`;
          } else {
            after = `${value.length} characters`;
          }
        }
        this.input = (
          <div>
            {horizontal && (
              <Flex flexWrap="wrap" p={1}>
                <Box width={[1, 2 / 12]}>
                  <label>{capitalize(field.label)}</label>
                </Box>
                <Box width={[1, 10 / 12]}>
                  <StyledTextarea
                    width="100%"
                    className={field.className}
                    onChange={event => this.handleChange(event.target.value)}
                    placeholder={this.props.placeholder}
                    value={this.state.value || this.props.defaultValue || ''}
                    maxLength={field.maxLength}
                  />
                  {after && <div className="after">{after}</div>}
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={1}>
                    <label>{`${capitalize(field.label)}`}</label>
                  </Box>
                )}
                <Box width={1}>
                  <StyledTextarea
                    width="100%"
                    className={field.className}
                    onChange={event => this.handleChange(event.target.value)}
                    placeholder={this.props.placeholder}
                    value={this.state.value || this.props.defaultValue || ''}
                    maxLength={field.maxLength}
                  />
                  {after && <div className="after">{after}</div>}
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
          </div>
        );
        break;
      }

      case 'tags':
        this.input = (
          <div>
            {horizontal && (
              <Flex flexWrap="wrap" p={1}>
                <Box width={[1, 2 / 12]}>
                  <label>{capitalize(field.label)}</label>
                </Box>
                <Box width={[1, 2 / 12]}>
                  <StyledInputTags {...field} onChange={entries => field.onChange(entries.map(e => e.value))} />
                </Box>
              </Flex>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={1}>
                    <label>{`${capitalize(field.label)}`}</label>
                  </Box>
                )}
                {field.description && <HelpBlock p={1}>{field.description}</HelpBlock>}
                <Box width={1}>
                  <StyledInputTags {...field} onChange={entries => field.onChange(entries.map(e => e.value))} />
                </Box>
              </Flex>
            )}
          </div>
        );
        break;

      case 'date':
      case 'datetime': {
        const timeFormat = field.type !== 'date';
        const { closeOnSelect } = this.props;

        this.input = (
          <div>
            {horizontal && (
              <Flex flexWrap="wrap" p={1}>
                <Box width={[1, 2 / 12]}>
                  <label>{capitalize(field.label)}</label>
                </Box>
                <Box width={[1, 10 / 12]}>
                  <DateTime
                    name={field.name}
                    timeFormat={field.timeFormat || timeFormat}
                    date={this.state.value || field.defaultValue}
                    timezone={context.timezone || 'utc'}
                    isValidDate={field.validate}
                    onChange={date => (date.toISOString ? this.handleChange(date.toISOString()) : false)}
                    closeOnSelect={closeOnSelect}
                  />
                </Box>
              </Flex>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={1}>
                    <label>{`${capitalize(field.label)}`}</label>
                  </Box>
                )}
                <Box width={1}>
                  <DateTime
                    name={field.name}
                    timeFormat={field.timeFormat || timeFormat}
                    date={this.state.value || field.defaultValue}
                    timezone={context.timezone || 'utc'}
                    isValidDate={field.validate}
                    onChange={date => (date.toISOString ? this.handleChange(date.toISOString()) : false)}
                    closeOnSelect={closeOnSelect}
                  />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
          </div>
        );
        break;
      }

      case 'component':
        this.input = (
          <div>
            {horizontal && (
              <Flex flexWrap="wrap" p={1}>
                <Box width={[1, 2 / 12]}>
                  <label>{capitalize(field.label)}</label>
                </Box>
                <Box width={[1, 10 / 12]}>
                  <field.component onChange={this.handleChange} {...field} {...field.options} />
                </Box>
              </Flex>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={1}>
                    <label>{`${capitalize(field.label)}`}</label>
                  </Box>
                )}
                <Box width={1}>
                  <field.component onChange={this.handleChange} {...field} {...field.options} />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
          </div>
        );
        break;

      case 'location':
        this.input = (
          <Flex flexWrap="wrap" p={1}>
            {field.label && (
              <Box width={1}>
                <label>{`${capitalize(field.label)}`}</label>
              </Box>
            )}
            <Box width={1}>
              <InputTypeLocation
                value={this.state.value || field.defaultValue}
                onChange={event => this.handleChange(event)}
                placeholder={field.placeholder}
                options={field.options}
              />
              {field.description && <HelpBlock>{field.description}</HelpBlock>}
            </Box>
          </Flex>
        );
        break;

      case 'country':
        this.input = (
          <div>
            {horizontal && (
              <Flex flexWrap="wrap" p={1}>
                <Box width={[1, 2 / 12]}>
                  <label>{capitalize(field.label)}</label>
                </Box>
                <Box width={[1, 10 / 12]}>
                  <InputTypeCountry
                    name={field.name}
                    inputId={field.name}
                    value={field.value}
                    defaultValue={field.defaultValue}
                    onChange={this.handleChange}
                  />
                </Box>
              </Flex>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={1}>
                    <label>{`${capitalize(field.label)}`}</label>
                  </Box>
                )}
                <Box width={1}>
                  <InputTypeCountry
                    name={field.name}
                    inputId={field.name}
                    value={field.value}
                    defaultValue={field.defaultValue}
                    onChange={this.handleChange}
                  />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
          </div>
        );
        break;

      case 'currency':
        value = value || field.defaultValue;
        value = typeof value === 'number' ? value / 100 : '';
        this.input = (
          <FieldGroup
            onChange={event => {
              return this.handleChange(event.target.value.length === 0 ? null : Math.round(event.target.value * 100));
            }}
            type="number"
            pre={field.pre}
            post={field.post}
            name={field.name}
            disabled={field.disabled}
            step={get(field, 'options.step') || '0.01'}
            min={(field.min || 0) / 100}
            label={typeof field.label === 'string' ? `${capitalize(field.label)}` : field.label}
            help={field.description}
            placeholder={field.placeholder}
            className={`currency ${field.className}`}
            onFocus={event => event.target.select()}
            value={value}
          />
        );
        break;

      case 'TimezonePicker':
        this.input = (
          <TimezonePicker
            label="Timezone"
            selectedTimezone={field.defaultValue}
            onChange={timezone => this.handleChange(timezone.value)}
          />
        );
        break;

      case 'select': {
        if (!field.options || field.options.length === 0) {
          // eslint-disable-next-line no-console
          console.warn('>>> InputField: options.length needs to be >= 1', field.options);
          return null;
        }

        const firstOptionValue =
          field.options[0].value !== undefined ? field.options[0].value : Object.keys(field.options[0])[0];

        let defaultValue;
        if (field.defaultValue) {
          let defaultOption;
          if (field.options[0].value !== undefined) {
            defaultOption = field.options.find(option => option.value === field.defaultValue);
            defaultValue = defaultOption;
          } else {
            defaultOption = field.options.find(option => Object.keys(option)[0] === field.defaultValue);
            defaultValue = {
              key: Object.keys(defaultOption)[0],
              value: Object.keys(defaultOption)[0],
              label: Object.values(defaultOption)[0],
            };
          }
        } else {
          if (field.options[0].value !== undefined) {
            defaultValue = {
              key: field.options[0].value,
              value: field.options[0].value,
              label: field.options[0].label,
            };
          } else {
            defaultValue = {
              key: Object.keys(field.options[0])[0],
              value: Object.keys(field.options[0])[0],
              label: Object.values(field.options[0])[0],
            };
          }
        }

        const StyledSelectComponent = (
          <StyledSelect
            inputId={`input-field-${field.name}`}
            name={field.name}
            data-cy={field.name}
            type="select"
            key={`${field.name}-${firstOptionValue}`} // make sure we instantiate a new component if first value changes
            placeholder={field.placeholder}
            className={field.className}
            defaultValue={defaultValue}
            disabled={field.disabled}
            isSearchable={field.options?.length > 15}
            options={
              field.options &&
              field.options.map(option => {
                const value = option.value !== undefined ? option.value : Object.keys(option)[0];
                const label = option.label || option[value];
                return { key: value, value: value, label: label };
              })
            }
            onChange={option => {
              this.handleChange(option.value);
            }}
          />
        );

        this.input = (
          <div>
            {horizontal && (
              <div>
                <Flex flexWrap="wrap" p={1}>
                  <Box width={[1, 2 / 12]}>
                    <label>{capitalize(field.label)}</label>
                  </Box>
                  <Box width={[1, 10 / 12]}>{StyledSelectComponent}</Box>
                </Flex>
                {field.description && (
                  <Flex flexWrap="wrap" p={1}>
                    <Box width={[1, 2 / 12]} />
                    <Box width={[1, 10 / 12]}>
                      <HelpBlock>{field.description}</HelpBlock>
                    </Box>
                  </Flex>
                )}
              </div>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={1}>
                    <label>{`${capitalize(field.label)}`}</label>
                  </Box>
                )}
                <Box width={1}>
                  {StyledSelectComponent}
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
          </div>
        );
        break;
      }

      case 'checkbox':
        this.input = (
          <div>
            {horizontal && (
              <div>
                <Flex flexWrap="wrap" p={1}>
                  <Box width={[1, 2 / 12]}>
                    <label>{capitalize(field.label)}</label>
                  </Box>
                  <Box width={[1, 10 / 12]}>
                    <StyledCheckbox
                      name="input-checkbox"
                      defaultChecked={field.defaultValue}
                      onChange={event => this.handleChange(event.target.checked)}
                      label={field.description}
                    />
                  </Box>
                </Flex>
                {field.help && (
                  <Flex flexWrap="wrap" p={1}>
                    <Box width={[1, 2 / 12]} />
                    <Box width={[1, 10 / 12]}>
                      <HelpBlock>{field.help}</HelpBlock>
                    </Box>
                  </Flex>
                )}
              </div>
            )}
            {!horizontal && (
              <Flex flexWrap="wrap" p={1}>
                <Box width={1}>
                  <StyledCheckbox
                    name="input-checkbox"
                    defaultChecked={field.defaultValue}
                    onChange={event => this.handleChange(event.target.checked)}
                    label={field.description}
                  />
                  {field.help && <HelpBlock>{field.help}</HelpBlock>}
                </Box>
              </Flex>
            )}
          </div>
        );
        break;

      case 'switch':
        this.input = (
          <div>
            {horizontal && (
              <Flex flexWrap="wrap" p={1}>
                {field.label && (
                  <Box width={[1, 2 / 12]}>
                    <label>{capitalize(field.label)}</label>
                  </Box>
                )}
                <Box width={[1, 10 / 12]}>
                  <InputSwitch
                    name={field.name}
                    defaultChecked={field.defaultValue}
                    onChange={event => this.handleChange(event.target.checked)}
                  />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </Box>
              </Flex>
            )}
            {!horizontal && (
              <React.Fragment>
                {field.label && <label>{capitalize(field.label)}</label>}
                <div className="switch">
                  <InputSwitch
                    name={field.name}
                    defaultChecked={field.defaultValue}
                    onChange={event => this.handleChange(event.target.checked)}
                  />
                  {field.description && <HelpBlock>{field.description}</HelpBlock>}
                </div>
              </React.Fragment>
            )}
          </div>
        );
        break;

      default: {
        this.input = (
          <FieldGroup
            onChange={event => this.handleChange(event.target.value)}
            type={field.type}
            pre={field.pre}
            post={field.post}
            button={field.button}
            name={field.name}
            maxLength={field.maxLength}
            disabled={field.disabled}
            label={field.label && `${capitalize(field.label)}`}
            help={field.description}
            autoFocus={field.focus}
            placeholder={field.placeholder}
            className={field.className}
            value={field.value}
            defaultValue={!isNil(field.defaultValue) ? field.defaultValue : ''}
            validationState={this.state.validationState}
            step={field.step}
            min={field.min}
            max={field.max}
          />
        );
        break;
      }
    }

    return (
      <InputFieldContainer
        className={`inputField ${this.props.className} ${this.props.name}`}
        key={`input-${this.props.name}`}
      >
        {this.input}
      </InputFieldContainer>
    );
  }
}

export default InputField;
