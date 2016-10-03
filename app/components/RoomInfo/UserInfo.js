import React, {PropTypes} from 'react';
import {View, Text} from 'react-native';
import s from '../../styles/screens/RoomInfo/RoomInfoStyles'

import Avatar from '../Avatar'
import Divider from '../Divider'

const RoomInfo = ({name, user}) => {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Avatar
          src={user.avatarUrlSmall}
          size={50} />
        <View style={s.headerTextContainer}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.owner}>@{user.username}</Text>
        </View>
      </View>
      <Divider />
    </View>
  )
}

RoomInfo.propTypes = {
  name: PropTypes.string,
  user: PropTypes.object
}

export default RoomInfo
