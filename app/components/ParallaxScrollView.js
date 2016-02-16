// ParallaxScrollView by @jaysoo
// used back
const React = require('react-native');
const {
  Animated,
  Component,
  Dimensions,
  ScrollView,
  View
} = React;

const styles = require('../styles/ParallaxScrollViewStyles');
import hexToRgb from '../utils/hexToRgb'

const { bool, func, number, string } = React.PropTypes;

const window = Dimensions.get('window');

const SCROLLVIEW_REF = 'ScrollView';

const pivotPoint = (a, b, c) => (a - b - c);

const renderEmpty = () => <View/>;

// Properties accepted by `ParallaxScrollView`.
const IPropTypes = {
  backgroundColor: string,
  backgroundScrollSpeed: number,
  fadeOutForeground: bool,
  fadeOutBackground: bool,
  contentBackgroundColor: string,
  onChangeHeaderVisibility: func,
  parallaxHeaderHeight: number.isRequired,
  renderBackground: func,
  renderFixedHeader: func,
  renderForeground: func,
  renderScrollComponent: func,
  renderStickyHeader: func,
  stickyHeaderHeight: number,
  pivotOffset: number
};

class ParallaxScrollView extends Component {
  constructor(props) {
    super(props);
    if (props.renderStickyHeader && !props.stickyHeaderHeight) {
      console.warn('Property `stickyHeaderHeight` must be set if `renderStickyHeader` is used.');
    }
    if (props.renderParallaxHeader !== renderEmpty && !props.renderForeground) {
      console.warn('Property `renderParallaxHeader` is deprecated. Use `renderForeground` instead.');
    }
    this.state = {
      scrollY: new Animated.Value(0),
      viewHeight: window.height,
      viewWidth: window.width,
      visible: false
    };
    this._footerComponent = { setNativeProps() {} }; // Initial stub
    this._footerHeight = 0;
  }

  render() {
    const {
      backgroundColor,
      backgroundScrollSpeed,
      children,
      contentBackgroundColor,
      fadeOutForeground,
      fadeOutBackground,
      parallaxHeaderHeight,
      renderBackground,
      renderFixedHeader,
      renderForeground,
      renderParallaxHeader,
      renderScrollComponent,
      renderStickyHeader,
      stickyHeaderHeight,
      style,
      pivotOffset,
      ...scrollViewProps
    } = this.props;

    const background = this._renderBackground({ fadeOutBackground, backgroundScrollSpeed, backgroundColor, parallaxHeaderHeight, stickyHeaderHeight, renderBackground, pivotOffset });
    const foreground = this._renderForeground({ fadeOutForeground, parallaxHeaderHeight, stickyHeaderHeight, renderForeground: renderForeground || renderParallaxHeader, pivotOffset });
    const bodyComponent = this._wrapChildren(children, { contentBackgroundColor, stickyHeaderHeight });
    const footerSpacer = this._renderFooterSpacer({ contentBackgroundColor });
    const maybeStickyHeader = this._maybeRenderStickyHeader({ parallaxHeaderHeight, stickyHeaderHeight, backgroundColor, renderFixedHeader, renderStickyHeader, pivotOffset });
    const scrollElement = renderScrollComponent(scrollViewProps);

    return (
      <View style={[style, styles.container]}
            onLayout={(e) => this._maybeUpdateViewDimensions(e)}>
        { background }
        {
          React.cloneElement(scrollElement, {
              ref: SCROLLVIEW_REF,
              style: [styles.scrollView, scrollElement.props.style],
              scrollEventThrottle: 16,
              onScroll: this._onScroll.bind(this),
            },
            foreground,
            bodyComponent,
            footerSpacer
          )
        }
        { maybeStickyHeader }
      </View>
    );
  }

  /*
   * Expose `ScrollView` API so this component is composable with any component that expects a `ScrollView`.
   */
  getScrollResponder() {
    return this.refs[SCROLLVIEW_REF].getScrollResponder();
  }
  getInnerViewNode() {
    return this.getScrollResponder().getInnerViewNode();
  }
  scrollTo(destY, destX) {
    this.getScrollResponder().scrollTo(destY, destX);
  }
  scrollWithoutAnimationTo(destY, destX) {
    this.getScrollResponder().scrollWithoutAnimationTo(destY, destX);
  }
  setNativeProps(props) {
    this.refs[SCROLLVIEW_REF].setNativeProps(props);
  }

  /*
   * Private helpers
   */

  _onScroll(e) {
    const {
      parallaxHeaderHeight,
      stickyHeaderHeight,
      onChangeHeaderVisibility,
      pivotOffset,
      onScroll: prevOnScroll = () => {}
      } = this.props;

    const p = pivotPoint(parallaxHeaderHeight, stickyHeaderHeight, pivotOffset);

    this._maybeUpdateScrollPosition(e);

    if (e.nativeEvent.contentOffset.y >= p) {
      if (!this.state.visible) {
        onChangeHeaderVisibility(true)
        this.setState({visible: true})
      }
    } else {
      if (this.state.visible) {
        onChangeHeaderVisibility(false)
        this.setState({visible: false})
      }
    }

    prevOnScroll(e);
  }

  // This optimizes the state update of current scrollY since we don't need to
  // perform any updates when user has scrolled past the pivot point.
  _maybeUpdateScrollPosition(e) {
    const { parallaxHeaderHeight, stickyHeaderHeight, pivotOffset } = this.props;
    const { scrollY } = this.state;
    const { nativeEvent: { contentOffset: { y: offsetY } } } = e;
    const p = pivotPoint(parallaxHeaderHeight, stickyHeaderHeight, pivotOffset);

    if (offsetY <= p || scrollY._value <= p) {
      scrollY.setValue(offsetY);
    }
  }

  _maybeUpdateViewDimensions(e) {
    const { nativeEvent: { layout: { width, height} } } = e;

    if (width !== this.state.viewWidth || height !== this.state.viewHeight) {
      this.setState({
        viewWidth: width,
        viewHeight: height
      });
    }
  }

  _renderBackground({ fadeOutBackground, backgroundScrollSpeed, backgroundColor, parallaxHeaderHeight, stickyHeaderHeight, renderBackground, pivotOffset }) {
    const { viewWidth, viewHeight, scrollY } = this.state;
    const p = pivotPoint(parallaxHeaderHeight, stickyHeaderHeight, pivotOffset);
    return (
      <Animated.View
        style={[styles.backgroundImage, {
            backgroundColor: backgroundColor,
            height: parallaxHeaderHeight,
            width: viewWidth,
            opacity: fadeOutBackground
                     ? scrollY.interpolate({
                      inputRange: [0, p *  (1/2), p * (3/4), p],
                      outputRange: [1, 0.3, 0.1, 0],
                      extrapolate: 'clamp'
                    })
                    : 1,
            transform: [{
              translateY: scrollY.interpolate({
                inputRange: [0, p],
                outputRange: [0, -(p / backgroundScrollSpeed)],
                extrapolateRight: 'extend',
                extrapolateLeft: 'clamp'
              })
            }, {
              scale: scrollY.interpolate({
                inputRange: [-viewHeight, 0],
                outputRange: [5, 1],
                extrapolate: 'clamp'
              })
            }]
          }]}>
        <View>
          { renderBackground() }
        </View>
      </Animated.View>
    );
  }

  _renderForeground({ fadeOutForeground, parallaxHeaderHeight, stickyHeaderHeight, renderForeground, pivotOffset }) {
    const { scrollY } = this.state;
    const p = pivotPoint(parallaxHeaderHeight, stickyHeaderHeight, pivotOffset);
    return (
      <View style={styles.parallaxHeaderContainer}>
        <Animated.View
          style={[styles.parallaxHeader, {
                  height: parallaxHeaderHeight,
                  opacity: fadeOutForeground
                     ? scrollY.interpolate({
                      inputRange: [0, p *  (1/2), p * (3/4), p],
                      outputRange: [1, 0.3, 0.1, 0],
                      extrapolate: 'clamp'
                    })
                    : 1
                }]}>
            <View style={{ height: parallaxHeaderHeight }}>
              { renderForeground() }
            </View>
        </Animated.View>
      </View>
    );
  }

  _wrapChildren(children, { contentBackgroundColor, stickyHeaderHeight }) {
    const { viewHeight } = this.state;
    return (
      <View
        style={{ backgroundColor: contentBackgroundColor }}>
        { children }
      </View>
    );
  }

  // onLayout={e => {
  //         // Adjust the bottom height so we can scroll the parallax header all the way up.
  //         const { nativeEvent: { layout: { height } } } = e;
  //         const footerHeight = Math.max(0, viewHeight - height - stickyHeaderHeight);
  //         if (this._footerHeight !== footerHeight) {
  //           this._footerComponent.setNativeProps({ style: { height: footerHeight }});
  //           this._footerHeight = footerHeight;
  //         }
  //       }}>

  _renderFooterSpacer({ contentBackgroundColor }) {
    return (
      <View ref={ref => this._footerComponent = ref } style={{ backgroundColor: contentBackgroundColor }}/>
    );
  }

  _maybeRenderStickyHeader({ parallaxHeaderHeight, stickyHeaderHeight, backgroundColor, renderFixedHeader, renderStickyHeader, pivotOffset }) {
    const { viewWidth, scrollY } = this.state;
    if (renderStickyHeader || renderFixedHeader) {
      const p = pivotPoint(parallaxHeaderHeight, stickyHeaderHeight, pivotOffset)
      const rgb = hexToRgb(backgroundColor)
      const input = `rgba(${rgb},0)`
      const output =  `rgba(${rgb},1.0)`

      return (
        <View style={[styles.stickyHeader, { width: viewWidth, ...(stickyHeaderHeight ? { height: stickyHeaderHeight } : null ) }]}>
          {
            renderStickyHeader
              ? (
                <Animated.View
                  style={{
                  backgroundColor: scrollY.interpolate({
                    inputRange: [(parallaxHeaderHeight / 4), p],
                    outputRange: [input, output],
                    extrapolate: 'clamp'
                  }),
                  height: stickyHeaderHeight
                }}>
                  <Animated.View
                    style={{
                    transform: [{
                      translateY: scrollY.interpolate({
                        inputRange: [0, p],
                        outputRange: [0, 0],
                        extrapolate: 'clamp'
                      })
                    }],
                    elevation: 8
                  }}>
                    { renderStickyHeader() }
                  </Animated.View>
                </Animated.View>
              )
              : null
          }
          { renderFixedHeader && renderFixedHeader() }
        </View>
      );
    } else {
      return null;
    }
  }
}

ParallaxScrollView.propTypes = IPropTypes;

ParallaxScrollView.defaultProps = {
  backgroundScrollSpeed: 20,
  backgroundColor: '#000',
  contentBackgroundColor: '#fff',
  fadeOutForeground: true,
  onChangeHeaderVisibility: () => {},
  renderScrollComponent: props => <ScrollView {...props}/>,
  renderBackground: renderEmpty,
  renderParallaxHeader: renderEmpty, // Deprecated (will be removed in 0.18.0)
  renderForeground: null,
  stickyHeaderHeight: 0,
  pivotOffset: 0
};

module.exports = ParallaxScrollView;
