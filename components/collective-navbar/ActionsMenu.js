import React from 'react';
import PropTypes from 'prop-types';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { MoneyCheckAlt } from '@styled-icons/fa-solid/MoneyCheckAlt';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { AttachMoney } from '@styled-icons/material/AttachMoney';
import { Dashboard } from '@styled-icons/material/Dashboard';
import { Settings } from '@styled-icons/material/Settings';
import { Stack } from '@styled-icons/remix-line/Stack';
import themeGet from '@styled-system/theme-get';
import { get, pickBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { getContributeRoute } from '../../lib/collective.lib';
import { getSettingsRoute } from '../../lib/url_helpers';

import AddFundsBtn from '../AddFundsBtn';
import AddPrepaidBudgetBtn from '../AddPrepaidBudgetBtn';
import ApplyToHostBtn from '../ApplyToHostBtn';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { Dropdown, DropdownArrow, DropdownContent } from '../StyledDropdown';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import { NAVBAR_ACTION_TYPE } from './menu';

//  Styled components
const MenuItem = styled('li')`
  display: flex;
  align-items: center;

  &,
  a,
  button {
    width: 100%;
    text-align: left;
    font-style: normal;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: -0.4px;
    outline: none;

    &:not(:hover) {
      color: #313233;
    }

    &:hover:not(:disabled):not(:active) {
      background: none;
      color: ${props => props.theme.colors.primary[600]};
    }

    &:focus {
      box-shadow: none;
      outline: none;
      text-decoration: underline;
      background: none;
      color: ${props => props.theme.colors.primary[600]};
    }

    &:disabled {
      color: #8c8c8c;
    }
  }

  svg {
    margin-right: 8px;
    fill: ${props => props.theme.colors.primary[600]};
    color: ${props => props.theme.colors.primary[600]};
  }

  ${props =>
    props.isHiddenOnMobile &&
    css`
      @media screen and (min-width: 40em) {
        display: none;
      }
    `}
`;

const ActionsDropdown = styled(Dropdown)`
  @media screen and (min-width: 40em) and (max-width: 88em) {
    ${DropdownContent} {
      right: 50px;
    }
  }

  @media (max-width: 40em) {
    ${DropdownArrow} {
      display: none !important;
    }
    ${DropdownContent} {
      display: block;
      position: relative;
      box-shadow: none;
      border: none;
      padding-left: 14px;
    }
  }

  ${props =>
    props.$isHiddenOnNonMobile &&
    css`
      @media screen and (min-width: 40em) {
        display: none;
      }
    `}
`;

const StyledActionButton = styled(StyledButton).attrs({ buttonSize: 'tiny' })`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  padding: 5px 10px;
  text-transform: uppercase;
  background: white;
  border-radius: 8px;
  border: 2px solid white;
  color: ${themeGet('colors.primary.700')};

  svg {
    stroke-width: 2;
  }

  &:hover {
    background: ${themeGet('colors.primary.100')};
  }

  &:hover:not(:focus) {
    border: 2px solid white;
  }

  &:active,
  &:focus,
  &:hover {
    background: ${themeGet('colors.primary.100')};
    color: ${themeGet('colors.primary.700')};
  }

  &:active,
  &:focus {
    border: 2px solid ${themeGet('colors.primary.700')};
    box-shadow: none;
  }

  span {
    vertical-align: middle;
    margin-right: 4px;
  }

  @media (max-width: 40em) {
    cursor: none;
    pointer-events: none;
  }
`;

const StyledChevronDown = styled(ChevronDown)`
  @media (max-width: 40em) {
    display: none;
  }
`;

const ITEM_PADDING = '11px 14px';

const CollectiveNavbarActionsMenu = ({ collective, callsToAction, hiddenActionForNonMobile }) => {
  const enabledCTAs = Object.keys(pickBy(callsToAction, Boolean));
  const isEmpty = enabledCTAs.length < 1;
  const hasOnlyOneHiddenCTA = enabledCTAs.length === 1 && hiddenActionForNonMobile === enabledCTAs[0];
  const hostedCollectivesLimit = get(collective, 'plan.hostedCollectivesLimit');
  const hostWithinLimit = hostedCollectivesLimit
    ? get(collective, 'plan.hostedCollectives') < hostedCollectivesLimit === true
    : true;

  // Do not render the menu if there are no available CTAs
  if (isEmpty) {
    return null;
  }

  return (
    <Container
      display={hasOnlyOneHiddenCTA ? ['flex', 'none'] : 'flex'}
      alignItems="center"
      order={[-1, 0]}
      borderTop={['1px solid #e1e1e1', 'none']}
    >
      <Box px={1}>
        <ActionsDropdown trigger="click" $isHiddenOnNonMobile={enabledCTAs.length <= 2}>
          {({ triggerProps, dropdownProps }) => (
            <React.Fragment>
              <Flex alignItems="center">
                <Box display={['block', 'none']} width={'32px'} ml={2}>
                  <StyledHr borderStyle="solid" borderColor="primary.600" />
                </Box>
                <StyledActionButton data-cy="collective-navbar-actions-btn" my={2} {...triggerProps}>
                  <Span>
                    <FormattedMessage id="CollectivePage.NavBar.ActionMenu.Actions" defaultMessage="Actions" />
                  </Span>
                  <StyledChevronDown size="14px" />
                </StyledActionButton>
              </Flex>
              <div {...dropdownProps}>
                <DropdownArrow />
                <DropdownContent>
                  <Box as="ul" p={0} m={0} minWidth={184}>
                    {callsToAction.hasSettings && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.SETTINGS}>
                        <StyledLink
                          as={Link}
                          href={getSettingsRoute(collective)}
                          p={ITEM_PADDING}
                          data-cy="edit-collective-btn"
                        >
                          <Settings size={20} />
                          <FormattedMessage id="Settings" defaultMessage="Settings" />
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasDashboard && (
                      <MenuItem isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.DASHBOARD}>
                        <StyledLink as={Link} href={`/${collective.slug}/dashboard`}>
                          <Container p={ITEM_PADDING}>
                            <Dashboard size="20px" />
                            <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasSubmitExpense && (
                      <MenuItem isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.SUBMIT_EXPENSE}>
                        <StyledLink as={Link} href={`/${collective.slug}/expenses/new`}>
                          <Container p={ITEM_PADDING}>
                            <Receipt size="20px" />
                            <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasRequestGrant && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.REQUEST_GRANT}>
                        <StyledLink as={Link} href={`/${collective.slug}/expenses/new`}>
                          <Container p={ITEM_PADDING}>
                            <MoneyCheckAlt size="20px" />
                            <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasManageSubscriptions && (
                      <MenuItem isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.MANAGE_SUBSCRIPTIONS}>
                        <StyledLink as={Link} href={`/${collective.slug}/recurring-contributions`}>
                          <Container p={ITEM_PADDING}>
                            <Stack size="20px" />
                            <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasContribute && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.CONTRIBUTE}>
                        <StyledLink as={Link} href={getContributeRoute(collective)}>
                          <Container p={ITEM_PADDING}>
                            <Planet size="20px" />
                            <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.addFunds && (
                      <AddFundsBtn collective={collective} host={collective.host}>
                        {btnProps => (
                          <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.ADD_FUNDS}>
                            <StyledButton p={ITEM_PADDING} isBorderless {...btnProps}>
                              <AttachMoney size="20px" />
                              <Span>
                                <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
                              </Span>
                            </StyledButton>
                          </MenuItem>
                        )}
                      </AddFundsBtn>
                    )}
                    {callsToAction.addPrepaidBudget && (
                      <AddPrepaidBudgetBtn collective={collective}>
                        {btnProps => (
                          <MenuItem
                            py={1}
                            isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.ADD_PREPAID_BUDGET}
                          >
                            <StyledButton p={ITEM_PADDING} isBorderless {...btnProps}>
                              <AttachMoney size="20px" />
                              <Span>
                                <FormattedMessage id="menu.addPrepaidBudget" defaultMessage="Add Prepaid Budget" />
                              </Span>
                            </StyledButton>
                          </MenuItem>
                        )}
                      </AddPrepaidBudgetBtn>
                    )}
                    {callsToAction.hasContact && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.CONTACT}>
                        <StyledLink as={Link} href={`/${collective.slug}/contact`}>
                          <Container p={ITEM_PADDING}>
                            <Envelope size="20px" />
                            <FormattedMessage id="Contact" defaultMessage="Contact" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                    {callsToAction.hasApply && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.APPLY}>
                        <ApplyToHostBtn
                          hostSlug={collective.slug}
                          hostWithinLimit={hostWithinLimit}
                          buttonProps={{ isBorderless: true, p: ITEM_PADDING }}
                        />
                      </MenuItem>
                    )}
                    {callsToAction.hasDelete && (
                      <MenuItem py={1} isHiddenOnMobile={hiddenActionForNonMobile === NAVBAR_ACTION_TYPE.DELETE}>
                        <StyledLink as={Link} href={`/${collective.slug}/delete`}>
                          <Container p={ITEM_PADDING}>
                            {/* TODO: find an icon */}
                            <FormattedMessage id="menu.deleteAccount" defaultMessage="Delete Account" />
                          </Container>
                        </StyledLink>
                      </MenuItem>
                    )}
                  </Box>
                </DropdownContent>
              </div>
            </React.Fragment>
          )}
        </ActionsDropdown>
      </Box>
    </Container>
  );
};

CollectiveNavbarActionsMenu.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    legacyId: PropTypes.number,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string,
    settings: PropTypes.object,
    tiers: PropTypes.array,
    host: PropTypes.shape({
      hostFees: PropTypes.bool,
    }),
  }),
  callsToAction: PropTypes.shape({
    /** Button to contact the collective */
    hasContact: PropTypes.bool,
    /** Submit new expense button */
    hasSubmitExpense: PropTypes.bool,
    /** Host's "Apply" button */
    hasApply: PropTypes.bool,
    /** Host's dashboard */
    hasDashboard: PropTypes.bool,
    /** Manage recurring contributions */
    hasManageSubscriptions: PropTypes.bool,
    /** Request a grant from a fund */
    hasRequestGrant: PropTypes.bool,
    /** Contribute financially to a collective */
    hasContribute: PropTypes.bool,
    /** Add funds to a collective */
    addFunds: PropTypes.bool,
    /** Add prepaid budget to an organization */
    addPrepaidBudget: PropTypes.bool,
    /** Button to Edit the Collective */
    hasSettings: PropTypes.bool,
    /** Button to Delete the Collective */
    hasDelete: PropTypes.bool,
  }).isRequired,
  hiddenActionForNonMobile: PropTypes.oneOf(Object.values(NAVBAR_ACTION_TYPE)),
};

CollectiveNavbarActionsMenu.defaultProps = {
  callsToAction: {},
  buttonsMinWidth: 100,
};

export default CollectiveNavbarActionsMenu;
