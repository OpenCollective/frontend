import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import Link from '../../Link';

const MenuLinkContainer = styled.li`
  margin: 4px -8px 0px;
  a {
    display: flex;
    justify-content: space-between;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    padding: 4px 12px;
    border-radius: 100px;
    color: ${props => props.theme.colors.black[700]};
    &:hover {
      color: ${props => props.theme.colors.primary[700]};
    }
    ${props =>
      props.isSelected &&
      css`
        background: ${props => props.theme.colors.primary[50]};
        color: ${props => props.theme.colors.primary[700]};
      `}
  }
`;

const MenuLink = ({ collective, section, selectedSection, children }) => {
  return (
    <MenuLinkContainer isSelected={selectedSection === section}>
      <Link href={`/${collective.slug}/admin/${section}`}>{children}</Link>
    </MenuLinkContainer>
  );
};

MenuLink.propTypes = {
  section: PropTypes.string,
  selectedSection: PropTypes.string,
  children: PropTypes.node,
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
};

export default MenuLink;
