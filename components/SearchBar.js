import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import SearchForm from './SearchForm';

const messages = defineMessages({
  searchPlaceholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search...',
  },
});

/**
 * A wrapper arround `SearchForm` that holds state and interacts with parent
 * through `onSubmit`, rather than `onChange`.
 */
const SearchBar = ({ onSubmit, defaultValue, ...props }) => {
  const [value, setValue] = React.useState(defaultValue || '');
  const intl = useIntl();

  // Reset value when `defaultValue` change, to handle reset filters
  React.useEffect(() => {
    setValue(defaultValue || '');
  }, [defaultValue]);

  return (
    <SearchForm
      placeholder={intl.formatMessage(messages.searchPlaceholder)}
      value={value}
      onChange={setValue}
      onSubmit={event => {
        event.preventDefault();
        const searchInput = event.target.elements.q;
        onSubmit(searchInput.value || null);
      }}
      {...props}
    />
  );
};

SearchBar.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  defaultValue: PropTypes.string,
};

export default SearchBar;
