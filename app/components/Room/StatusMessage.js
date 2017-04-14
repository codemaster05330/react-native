import React, {PropTypes} from 'react';
import {Image, View} from 'react-native';
import s from '../../styles/screens/Room/StatusMessageStyles'
import Parser from 'react-native-parsed-text'
import Emoji from '../Emoji'
import Button from '../Button'

const EMOJI_REGEX = /:([a-z0-9A-Z_-]+):/
const THUMBSUP = /:\+1:/
const THUMBSDOWN = /:\-1:/

const renderEmoji = (matchingString, matches) => {
  const name = matches[0].replace(/:/, '')
  return (
    <Emoji name={name} />
  )
}

const StatusMessage = ({onPress, onLongPress, text, handleUrlPress, backgroundColor, opacity, onLayout}) => {
  const patterns = [
    {type: 'url', style: s.url, onPress: handleUrlPress},
    {pattern: EMOJI_REGEX, style: s.emoji, renderText: renderEmoji},
    {pattern: THUMBSUP, style: s.emoji, renderText: renderEmoji},
    {pattern: THUMBSDOWN, style: s.emoji, renderText: renderEmoji}
  ]

  return (
    <Button
      style={[s.container, {backgroundColor}]}
      onPress={() => onPress()}
      onLayout={e => onLayout(e)}
      onLongPress={() => onLongPress()}>
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
      <View style={s.readStatus}>
        <Image
          style={[s.readStatusIcon, {opacity}]}
          source={require('../../images/icons/ic_done_black_24dp.png')} />
      </View>
    </Button>
  )
}

StatusMessage.propTypes = {
  onPress: PropTypes.func,
  onLongPress: PropTypes.func,
  text: PropTypes.string,
  handleUrlPress: PropTypes.func,
  backgroundColor: PropTypes.string,
  opacity: PropTypes.number
}

export default StatusMessage
