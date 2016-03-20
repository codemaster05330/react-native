import React, {
  Component,
  PropTypes,
  Text,
  Linking
} from 'react-native'
import s from '../styles/components/LinkStyles'
import {THEMES} from '../constants'
const {colors} = THEMES.gitterDefault


export default class Link extends Component {
  render() {
    const {children, to, fontSize} = this.props
    return (
      <Text
        style={[s, {color: colors.link}, {fontSize}]}
        onPress={() => Linking.openURL(to)}>
        {children}
      </Text>
    )
  }
}

Link.propTypes = {
  children: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  fontSize: PropTypes.number
}
