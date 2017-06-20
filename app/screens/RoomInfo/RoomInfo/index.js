import PropTypes from 'prop-types'
import React from 'react'
import {View, Text} from 'react-native';
import s from './styles'

import {createGhAvatarLink} from '../../../utils/links'
import channelNameAndOwner from '../../../utils/channelNameAndOwner'

import Avatar from '../../../components/Avatar'
import Divider from '../../../components/Divider'

const RoomInfo = ({name}) => {
  const avatarSrc = createGhAvatarLink(name.split('/')[0], 200)
  const channel = channelNameAndOwner(name)

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Avatar
          src={avatarSrc}
          size={50} />
        {!channel.name
          ? (
          <View style={s.headerTextContainer}>
            <Text style={s.name}>{channel.owner}</Text>
          </View>
        ) : (
          <View style={s.headerTextContainer}>
            <Text style={s.name}>{channel.name}</Text>
            <Text style={s.owner}>by {channel.owner}</Text>
          </View>
        )}
      </View>
      <Divider />
    </View>
  )
}

RoomInfo.propTypes = {
  name: PropTypes.string
}

export default RoomInfo
