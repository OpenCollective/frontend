import React from 'react';
import PropTypes from 'prop-types';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import { ArrowForward } from '@styled-icons/material/ArrowForward';
import styled from 'styled-components';

import { debounceScroll } from '../lib/ui-utils';
import withViewport from '../lib/withViewport';

import { Box, Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';
import { Dimensions } from './collective-page/_constants';

const RefContainer = styled(Box)`
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;

  /** Respect left margin / center cards on widescreens */

  @supports (width: fit-content) {
    @media (min-width: ${Dimensions.MAX_SECTION_WIDTH}px) {
      margin: 0 auto;
      min-width: ${Dimensions.MAX_SECTION_WIDTH}px;
      width: fit-content;
      max-width: 100%;
    }
  }

  @supports not (width: fit-content) {
    @media (min-width: ${Dimensions.MAX_SECTION_WIDTH}px) {
      padding-left: calc((100% - ${Dimensions.MAX_SECTION_WIDTH + 10}px) / 2);
    }
  }
`;

const ControlsContainer = styled(Flex)`
  z-index: 10;
  position: relative;
  top: 30rem;
  pointer-events: none;
`;

const ArrowContainer = styled(StyledRoundButton)`
  transition: opacity 0.25s ease-in, visibility 0.25s;
  visibility: ${props => (props.isVisible ? 'hidden' : 'visible')};
  opacity: ${props => (props.isVisible ? '0' : '1')};
  pointer-events: auto;

  svg {
    height: 40px;
    padding 7px;
  }
`;

/**
 * Helper to display a list of horizontally scrollable items, with two little
 * carets to navigate easily.
 */
class HorizontalScroller extends React.PureComponent {
  static propTypes = {
    /* Children component */
    children: PropTypes.node.isRequired,
    /** Callback to get the scrolled distance when we click on prev/next controllers */
    getScrollDistance: PropTypes.func,
    /** @ignore from withViewport */
    width: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = { canGoPrev: false, canGoNext: false };
  }

  componentDidMount() {
    if (this.ref.current) {
      this.ref.current.addEventListener('scroll', this.updateScrollInfo);
      this.updateScrollInfo();
    }
  }

  componentDidUpdate(oldProps) {
    if (oldProps.width !== this.props.width) {
      this.updateScrollInfo();
    }
  }

  componentWillUnmount() {
    if (this.ref.current) {
      this.ref.current.removeEventListener('scroll', this.updateScrollInfo);
    }
  }

  updateScrollInfo = debounceScroll(() => {
    if (!this.ref.current) {
      return;
    }

    const { offsetWidth, scrollLeft, scrollWidth } = this.ref.current;

    this.setState({
      canGoPrev: scrollLeft > 0,
      canGoNext: scrollLeft + offsetWidth < scrollWidth,
    });
  });

  // Manually move scroll. We don't need to check for limits here because browsers
  // already cap the value. See https://developer.mozilla.org/en/docs/Web/API/Element/scrollLeft:
  // > scrollLeft can be specified as any integer value. However:
  // > - If the element can't be scrolled (e.g., it has no overflow), scrollLeft is set to 0.
  // > - If specified as a value less than 0 (greater than 0 for right-to-left elements), scrollLeft is set to 0.
  // > - If specified as a value greater than the maximum that the content can be scrolled, scrollLeft is set to the maximum.
  onPrevClick = () => {
    if (this.ref.current) {
      this.ref.current.scrollLeft -= this.getScrollDistance();
    }
  };

  onNextClick = () => {
    if (this.ref.current) {
      this.ref.current.scrollLeft += this.getScrollDistance();
    }
  };

  getScrollDistance() {
    const offsetWidth = this.ref.current.offsetWidth;
    if (this.props.getScrollDistance) {
      return this.props.getScrollDistance(offsetWidth);
    } else {
      // Default behavior: scroll by 75% of the full width
      const scrollPercentage = 0.75;
      return scrollPercentage * offsetWidth;
    }
  }

  render() {
    const { canGoPrev, canGoNext } = this.state;

    return (
      <Box>
        <ControlsContainer mx={[2, 2, 5]} justifyContent="space-between">
          <ArrowContainer isVisible={!canGoPrev}>
            <ArrowBack onMouseDown={canGoPrev ? this.onPrevClick : undefined} />
          </ArrowContainer>
          <ArrowContainer isVisible={!canGoNext}>
            <ArrowForward onMouseDown={canGoNext ? this.onNextClick : undefined} />
          </ArrowContainer>
        </ControlsContainer>
        <RefContainer ref={this.ref}>{this.props.children}</RefContainer>
      </Box>
    );
  }
}

// We don't use the data from `withViewport`, but we use it to update the
// component when the window's width changes.
export default withViewport(HorizontalScroller, { withWidth: true });
