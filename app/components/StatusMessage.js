import React, {
  PropTypes,
  TouchableNativeFeedback,
  View,
  Text
} from 'react-native'
import s from '../styles/StatusMessageStyles'
import Parser from 'react-native-parsed-text'
import Emoji from './Emoji'

const EMOJI_REGEX = /:([a-z0-9A-Z_-]+):/
const THUMBSUP = /:\+1:/g
const THUMBSDOWN = /:\-1:/g

const renderEmoji = (matchingString, matches) => {
  const name = matches[0].replace(/:/g, '')
  return (
    <Emoji name={name} />
  )
}

const StatusMessage = ({onPress, onLongPress, text, handleUrlPress, backgroundColor}) => {
  const patterns = [
    {type: 'url', style: s.url, onPress: handleUrlPress},
    {pattern: EMOJI_REGEX, style: s.emoji, renderText: renderEmoji},
    {pattern: THUMBSUP, style: s.emoji, renderText: renderEmoji},
    {pattern: THUMBSDOWN, style: s.emoji, renderText: renderEmoji}
  ]

  return (
    <TouchableNativeFeedback
      onPress={() => onPress()}
      onLongPress={() => onLongPress()}>
      <View style={[s.container, {backgroundColor}]}>
        <View style={{
          width: 30
        }} />
        <View style={s.content}>
          <View>
            <Parser
              style={s.text}
              parse={patterns}>
              {text}
            </Parser>
          </View>
        </View>
      </View>
    </TouchableNativeFeedback>
  )
}

StatusMessage.propTypes = {
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  text: PropTypes.string,
  handleUrlPress: PropTypes.func,
  backgroundColor: PropTypes.object
}

export default StatusMessage
