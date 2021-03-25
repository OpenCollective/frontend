import React, { Fragment, useRef } from 'react';
import { PropTypes } from 'prop-types';
import { DotsVerticalRounded } from '@styled-icons/boxicons-regular/DotsVerticalRounded';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Planet } from '@styled-icons/boxicons-regular/Planet';
import { Receipt } from '@styled-icons/boxicons-regular/Receipt';
import { MoneyCheckAlt } from '@styled-icons/fa-solid/MoneyCheckAlt';
import { AttachMoney } from '@styled-icons/material/AttachMoney';
import { Close } from '@styled-icons/material/Close';
import { Dashboard } from '@styled-icons/material/Dashboard';
import { Settings } from '@styled-icons/material/Settings';
import { Stack } from '@styled-icons/remix-line/Stack';
import themeGet from '@styled-system/theme-get';
import { get, pickBy, without } from 'lodash';
import { darken } from 'polished';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { display } from 'styled-system';

import { getContributeRoute } from '../../lib/collective.lib';
import { getFilteredSectionsForCollective, isSectionEnabled, NAVBAR_CATEGORIES } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';
import { getSettingsRoute } from '../../lib/url_helpers';

import AddFundsBtn from '../AddFundsBtn';
import AddPrepaidBudgetBtn from '../AddPrepaidBudgetBtn';
import ApplyToHostBtn from '../ApplyToHostBtn';
import Avatar from '../Avatar';
import { Dimensions, Sections } from '../collective-page/_constants';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import StyledButton from '../StyledButton';
import { fadeIn } from '../StyledKeyframes';
import { Span } from '../Text';
import { useUser } from '../UserProvider';

import CollectiveNavbarActionsMenu from './ActionsMenu';
import { getNavBarMenu, NAVBAR_ACTION_TYPE } from './menu';
import NavBarCategoryDropdown, { NavBarCategory } from './NavBarCategoryDropdown';

const NavBarContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 999;
  background: white;
  box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
`;

const NavbarContentContainer = styled(Container)`
  background: white;
  display: flex;
  justify-content: flex-start;
`;

const AvatarBox = styled(Box)`
  position: relative;

  &::before {
    content: '';
    height: 24px;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    margin-top: auto;
    margin-bottom: auto;
    border-right: 2px solid rgba(214, 214, 214, 1);
  }
`;

const BackButtonAndAvatar = styled.div`
  display: flex;

  @media (min-width: 64em) {
    &[data-hide-on-desktop='false'] {
      width: 48px;
      opacity: 1;
      visibility: visible;
      margin-right: 8px;
      transition: opacity 0.1s ease-out, visibility 0.2s ease-out, margin 0.075s, width 0.075s ease-in-out;
    }

    &[data-hide-on-desktop='true'] {
      width: 0px;
      margin-right: 0px;
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.1s ease-out, visibility 0.2s ease-out, margin 0.075s, width 0.075s ease-in-out;
    }
  }
`;

const InfosContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
`;

const CollectiveName = styled(LinkCollective).attrs({
  fontSize: ['16px', '18px'],
  color: 'black.800',
})`
  ${display}
  letter-spacing: -0.8px;
  margin: 8px;
  min-width: 0;
  text-decoration: none;
  text-align: center;
  font-weight: 500;
  line-height: 24px;

  &,
  a {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &:not(:hover) {
    color: #313233;
  }
`;

const CategoriesContainer = styled(Container)`
  @media screen and (min-width: 40em) and (max-width: 64em) {
    border: 1px solid rgba(214, 214, 214, 0.3);
    border-radius: 0px 0px 0px 8px;
    box-shadow: 0px 6px 10px -5px rgba(214, 214, 214, 0.5);
    position: absolute;
    right: 0;
    top: 64px;
    width: 0;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.4s ease-out, visibility 0.4s ease-out, width 0.2s ease-out;

    ${props =>
      props.isExpanded &&
      css`
        width: 400px;
        visibility: visible;
        opacity: 1;
      `}
  }
`;

const MobileCategoryContainer = styled(Container).attrs({ display: ['block', null, null, 'none'] })`
  animation: ${fadeIn} 0.2s;
  margin-left: 8px;
`;

/** Displayed on mobile & tablet to toggle the menu */
const ExpandMenuIcon = styled(DotsVerticalRounded).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: ${themeGet('colors.primary.600')};

  &:hover {
    background: radial-gradient(transparent 14px, white 3px),
      linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
      linear-gradient(${themeGet('colors.primary.600')}, ${themeGet('colors.primary.600')});
  }

  &:active {
    background: radial-gradient(${themeGet('colors.primary.600')} 14px, white 3px);
    color: ${themeGet('colors.white.full')};
  }

  @media (min-width: 64em) {
    display: none;
  }
`;

const CloseMenuIcon = styled(Close).attrs({ size: 28 })`
  cursor: pointer;
  margin-right: 4px;
  flex: 0 0 28px;
  color: ${themeGet('colors.primary.600')};

  &:hover {
    background: radial-gradient(transparent 14px, white 3px),
      linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
      linear-gradient(${themeGet('colors.primary.600')}, ${themeGet('colors.primary.600')});
  }

  &:active {
    background: radial-gradient(${themeGet('colors.primary.600')} 14px, white 3px);
    color: ${themeGet('colors.white.full')};
  }

  @media (min-width: 64em) {
    display: none;
  }
`;

const isFeatureAvailable = (collective, feature) => {
  const status = get(collective.features, feature);
  return status === 'ACTIVE' || status === 'AVAILABLE';
};

const getHasContribute = (collective, sections, isAdmin) => {
  return (
    [CollectiveType.FUND, CollectiveType.PROJECT].includes(collective.type) &&
    collective.isActive &&
    getContributeRoute(collective) &&
    isSectionEnabled(sections, Sections.CONTRIBUTE, isAdmin)
  );
};

const getDefaultCallsToActions = (collective, sections, isAdmin, isHostAdmin, isRoot) => {
  if (!collective) {
    return {};
  }

  const isFund = collective.type === CollectiveType.FUND;
  const { type, features, settings } = collective;
  return {
    hasContribute: getHasContribute(collective, sections, isAdmin),
    hasContact: isFeatureAvailable(collective, 'CONTACT_FORM'),
    hasApply: isFeatureAvailable(collective, 'RECEIVE_HOST_APPLICATIONS'),
    hasSubmitExpense: isFeatureAvailable(collective, 'RECEIVE_EXPENSES'),
    hasManageSubscriptions: isAdmin && get(features, 'RECURRING_CONTRIBUTIONS') === 'ACTIVE',
    hasDashboard: isAdmin && isFeatureAvailable(collective, 'HOST_DASHBOARD'),
    hasRequestGrant: isFund || get(settings, 'fundingRequest') === true,
    addPrepaidBudget: isRoot && type === CollectiveType.ORGANIZATION,
    addFunds: isHostAdmin,
    hasSettings: isAdmin,
    hasDelete: isRoot,
  };
};

/**
 * Returns the main CTA that should be displayed as a button outside of the action menu in this component.
 */
const getMainAction = (collective, callsToAction) => {
  if (!collective || !callsToAction) {
    return null;
  }

  // Order of the condition defines main call to action: first match gets displayed
  if (callsToAction.includes(NAVBAR_ACTION_TYPE.SETTINGS)) {
    return {
      type: NAVBAR_ACTION_TYPE.SETTINGS,
      component: (
        <Link href={getSettingsRoute(collective)} data-cy="edit-collective-btn">
          <MainActionBtn tabIndex="-1">
            <Settings size="1em" />
            <Span ml={2}>
              <FormattedMessage id="Settings" defaultMessage="Settings" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasDashboard')) {
    return {
      type: NAVBAR_ACTION_TYPE.DASHBOARD,
      component: (
        <Link href={`/${collective.slug}/dashboard`}>
          <MainActionBtn tabIndex="-1">
            <Dashboard size="1em" />
            <Span ml={2}>
              <FormattedMessage id="host.dashboard" defaultMessage="Dashboard" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasContribute')) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTRIBUTE,
      component: (
        <Link href={getContributeRoute(collective)}>
          <MainActionBtn tabIndex="-1">
            <Planet size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.contributeMoney" defaultMessage="Contribute Money" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasApply')) {
    const plan = collective.plan || {};
    return {
      type: NAVBAR_ACTION_TYPE.APPLY,
      component: (
        <ApplyToHostBtn
          hostSlug={collective.slug}
          buttonRenderer={props => <MainActionBtn {...props} />}
          hostWithinLimit={!plan.hostedCollectivesLimit || plan.hostedCollectives < plan.hostedCollectivesLimit}
        />
      ),
    };
  } else if (callsToAction.includes('hasRequestGrant')) {
    return {
      type: NAVBAR_ACTION_TYPE.REQUEST_GRANT,
      component: (
        <Link href={`/${collective.slug}/expenses/new`}>
          <MainActionBtn tabIndex="-1">
            <MoneyCheckAlt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="ExpenseForm.Type.Request" defaultMessage="Request Grant" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasSubmitExpense')) {
    return {
      type: NAVBAR_ACTION_TYPE.SUBMIT_EXPENSE,
      component: (
        <Link href={`/${collective.slug}/expenses/new`}>
          <MainActionBtn tabIndex="-1">
            <Receipt size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.submitExpense" defaultMessage="Submit Expense" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasManageSubscriptions')) {
    return {
      type: NAVBAR_ACTION_TYPE.MANAGE_SUBSCRIPTIONS,
      component: (
        <Link href={`/${collective.slug}/recurring-contributions`}>
          <MainActionBtn tabIndex="-1">
            <Stack size="1em" />
            <Span ml={2}>
              <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasContact')) {
    return {
      type: NAVBAR_ACTION_TYPE.CONTACT,
      component: (
        <Link href={`/${collective.slug}/contact`}>
          <MainActionBtn tabIndex="-1">
            <Envelope size="1em" />
            <Span ml={2}>
              <FormattedMessage id="Contact" defaultMessage="Contact" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes('hasDelete')) {
    return {
      type: NAVBAR_ACTION_TYPE.DELETE,
      component: (
        <Link href={`/${collective.slug}/delete`}>
          <MainActionBtn tabIndex="-1">
            {/* TODO: find an icon */}
            <Span ml={2}>
              <FormattedMessage id="menu.deleteAccount" defaultMessage="Delete Account" />
            </Span>
          </MainActionBtn>
        </Link>
      ),
    };
  } else if (callsToAction.includes(NAVBAR_ACTION_TYPE.ADD_FUNDS) && collective.host) {
    return {
      type: NAVBAR_ACTION_TYPE.ADD_FUNDS,
      component: (
        <AddFundsBtn collective={collective} host={collective.host}>
          {btnProps => (
            <MainActionBtn {...btnProps}>
              <AttachMoney size="1em" />
              <Span>
                <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
              </Span>
            </MainActionBtn>
          )}
        </AddFundsBtn>
      ),
    };
  } else if (callsToAction.includes(NAVBAR_ACTION_TYPE.ADD_PREPAID_BUDGET)) {
    return {
      type: NAVBAR_ACTION_TYPE.ADD_PREPAID_BUDGET,
      component: (
        <AddPrepaidBudgetBtn collective={collective}>
          {btnProps => (
            <MainActionBtn {...btnProps}>
              <AttachMoney size="1em" />
              <Span>
                <FormattedMessage id="menu.addPrepaidBudget" defaultMessage="Add Prepaid Budget" />
              </Span>
            </MainActionBtn>
          )}
        </AddPrepaidBudgetBtn>
      ),
    };
  } else {
    return null;
  }
};

export const MainActionBtn = styled(StyledButton).attrs({ buttonSize: 'tiny' })`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  padding: 5px 10px;
  white-space: nowrap;
  text-transform: uppercase;
  background: ${themeGet('colors.primary.100')};
  border-radius: 8px;
  color: ${themeGet('colors.primary.700')};
  border: none;

  &,
  span {
    letter-spacing: 0.01em;
  }

  &:hover {
    background: ${props => darken(0.025, props.theme.colors.primary[100])};
  }

  &:active,
  &:focus {
    background: ${themeGet('colors.primary.700')};
    color: ${themeGet('colors.white.full')};
    box-shadow: none;
  }

  span {
    vertical-align: middle;
  }
`;

/**
 * The NavBar that displays all the individual sections.
 */
const CollectiveNavbar = ({
  collective,
  isAdmin,
  isLoading,
  sections: sectionsFromParent,
  selectedCategory,
  callsToAction,
  onCollectiveClick,
  isInHero,
  onlyInfos,
  showBackButton,
  useAnchorsForCategories,
  showSelectedCategoryOnMobile,
}) => {
  const intl = useIntl();
  const [isExpanded, setExpanded] = React.useState(false);
  const { LoggedInUser } = useUser();
  isAdmin = isAdmin || LoggedInUser?.canEditCollective(collective);
  const isHostAdmin = LoggedInUser?.isHostAdmin(collective);
  const sections = React.useMemo(() => {
    return sectionsFromParent || getFilteredSectionsForCollective(collective, isAdmin, isHostAdmin);
  }, [sectionsFromParent, collective, isAdmin, isHostAdmin]);
  const isRoot = LoggedInUser?.isRoot();
  callsToAction = { ...getDefaultCallsToActions(collective, sections, isAdmin, isHostAdmin, isRoot), ...callsToAction };
  const actionsArray = Object.keys(pickBy(callsToAction, Boolean));
  const mainAction = getMainAction(collective, actionsArray);
  const secondAction = actionsArray.length === 2 && getMainAction(collective, without(actionsArray, mainAction?.type));
  const navbarRef = useRef();

  /** This is to close the navbar dropdown menus (desktop)/slide-out menu (tablet)/non-collapsible menu (mobile)
   * when we click a category header to scroll down to (i.e. Connect) or sub-section page to open (i.e. Updates) */
  useGlobalBlur(navbarRef, outside => {
    if (!outside && isExpanded) {
      setTimeout(() => {
        setExpanded(false);
      }, 200);
    }
  });

  return (
    <NavBarContainer>
      <NavbarContentContainer
        flexDirection={['column', 'row']}
        px={[0, 3, null, Dimensions.PADDING_X[1]]}
        mx="auto"
        maxWidth={Dimensions.MAX_SECTION_WIDTH}
        maxHeight="100vh"
        minHeight={[56, 64]}
      >
        {/** Collective info */}
        <InfosContainer px={[3, 0]} py={[2, 1]}>
          <Flex alignItems="center" maxWidth={['90%', '100%']} flex="1 1">
            <BackButtonAndAvatar data-hide-on-desktop={isInHero}>
              {showBackButton && (
                <Container display={['none', null, null, null, 'block']} position="absolute" left={-30}>
                  {collective && (
                    <Link href={`/${collective.slug}`}>
                      <StyledButton px={1} isBorderless>
                        &larr;
                      </StyledButton>
                    </Link>
                  )}
                </Container>
              )}
              <AvatarBox>
                <LinkCollective collective={collective} onClick={onCollectiveClick}>
                  <Container borderRadius="25%" mr={2}>
                    <Avatar collective={collective} radius={40} />
                  </Container>
                </LinkCollective>
              </AvatarBox>
            </BackButtonAndAvatar>

            <Container display={onlyInfos ? 'flex' : ['flex', null, null, 'none']} minWidth={0}>
              {isLoading ? (
                <LoadingPlaceholder height={14} minWidth={100} />
              ) : isInHero ? (
                <React.Fragment>
                  <CollectiveName collective={collective} display={['block', 'none']}>
                    <FormattedMessage
                      id="NavBar.ThisIsCollective"
                      defaultMessage="This is {collectiveName}'s page"
                      values={{ collectiveName: collective.name }}
                    />
                  </CollectiveName>
                  <CollectiveName collective={collective} display={['none', 'block']} />
                </React.Fragment>
              ) : selectedCategory && showSelectedCategoryOnMobile ? (
                <MobileCategoryContainer>
                  <NavBarCategory category={selectedCategory} />
                </MobileCategoryContainer>
              ) : (
                <CollectiveName collective={collective} onClick={onCollectiveClick} />
              )}
            </Container>
          </Flex>
          {!onlyInfos && (
            <Box display={['block', 'none']} flex="0 0 32px">
              {isExpanded ? (
                <CloseMenuIcon onClick={() => setExpanded(!isExpanded)} />
              ) : (
                <ExpandMenuIcon onClick={() => setExpanded(!isExpanded)} />
              )}
            </Box>
          )}
        </InfosContainer>
        {/** Main navbar items */}

        {!onlyInfos && (
          <Fragment>
            <CategoriesContainer
              ref={navbarRef}
              backgroundColor="#fff"
              display={isExpanded ? 'flex' : ['none', 'flex']}
              flexDirection={['column', null, null, 'row']}
              flexShrink={2}
              flexGrow={1}
              justifyContent={['space-between', null, 'flex-start']}
              order={[0, 3, 0]}
              overflowX="auto"
              isExpanded={isExpanded}
            >
              {isLoading ? (
                <LoadingPlaceholder height={34} minWidth={100} maxWidth={200} my={15} />
              ) : (
                getNavBarMenu(intl, collective, sections).map(({ category, links }) => (
                  <NavBarCategoryDropdown
                    key={category}
                    collective={collective}
                    category={category}
                    links={links}
                    isSelected={selectedCategory === category}
                    useAnchor={useAnchorsForCategories}
                  />
                ))
              )}
            </CategoriesContainer>

            {/* CTAs */}
            <Container
              display={isExpanded ? 'flex' : ['none', 'flex']}
              flexDirection={['column', 'row']}
              flexBasis="fit-content"
              marginLeft={[0, 'auto']}
              backgroundColor="#fff"
              zIndex={1}
            >
              {mainAction && (
                <Container display={['none', 'flex']} alignItems="center">
                  {mainAction.component}
                  {secondAction?.component ? <Container ml={2}>{secondAction?.component}</Container> : null}
                </Container>
              )}
              {!isLoading && (
                <CollectiveNavbarActionsMenu
                  collective={collective}
                  callsToAction={callsToAction}
                  hiddenActionForNonMobile={mainAction?.type}
                />
              )}
              {!onlyInfos && (
                <Container display={['none', 'flex', null, null, 'none']} alignItems="center">
                  {isExpanded ? (
                    <CloseMenuIcon onClick={() => setExpanded(!isExpanded)} />
                  ) : (
                    <ExpandMenuIcon onClick={() => setExpanded(!isExpanded)} />
                  )}
                </Container>
              )}
            </Container>
          </Fragment>
        )}
      </NavbarContentContainer>
    </NavBarContainer>
  );
};

CollectiveNavbar.propTypes = {
  /** Collective to show info about */
  collective: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    path: PropTypes.string,
    isArchived: PropTypes.bool,
    canContact: PropTypes.bool,
    canApply: PropTypes.bool,
    host: PropTypes.object,
    plan: PropTypes.object,
    parentCollective: PropTypes.object,
  }),
  /** Defines the calls to action displayed next to the NavBar items. Match PropTypes of `CollectiveCallsToAction` */
  callsToAction: PropTypes.shape({
    hasContact: PropTypes.bool,
    hasSubmitExpense: PropTypes.bool,
    hasApply: PropTypes.bool,
    hasDashboard: PropTypes.bool,
    hasManageSubscriptions: PropTypes.bool,
    hasSettings: PropTypes.bool,
  }),
  /** Used to check what sections can be used */
  isAdmin: PropTypes.bool,
  /** Will show loading state */
  isLoading: PropTypes.bool,
  /** The list of sections to be displayed by the NavBar. If not provided, will show all the sections available to this collective type. */
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['CATEGORY', 'SECTION']),
      name: PropTypes.string,
    }),
  ),
  /** Called when users click the collective logo or name */
  onCollectiveClick: PropTypes.func,
  /** Currently selected category */
  selectedCategory: PropTypes.oneOf(Object.values(NAVBAR_CATEGORIES)),
  /** The behavior of the navbar is slightly different when integrated in a hero (in the collective page) */
  isInHero: PropTypes.bool,
  /** If true, the CTAs will be hidden on mobile */
  hideButtonsOnMobile: PropTypes.bool,
  /** If true, the Navbar items and buttons will be skipped  */
  onlyInfos: PropTypes.bool,
  /** Set this to true to make the component smaller in height */
  isSmall: PropTypes.bool,
  showBackButton: PropTypes.bool,
  showSelectedCategoryOnMobile: PropTypes.bool,
  /** To use on the collective page. Sets links to anchors rather than full URLs for faster navigation */
  useAnchorsForCategories: PropTypes.bool,
};

CollectiveNavbar.defaultProps = {
  isInHero: false,
  onlyInfos: false,
  callsToAction: {},
  showBackButton: true,
};

export default React.memo(CollectiveNavbar);
