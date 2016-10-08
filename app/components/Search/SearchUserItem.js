import React, {PropTypes} from 'react';
import {View, Text} from 'react-native';
import Button from '../Button'
import s from '../../styles/screens/Home/HomeRoomItemStyles'
import Avatar from '../Avatar'

const SearchUserItem = ({id, username, displayName, avatarUrlMedium, onPress}) => {
  return (
    <Button
      onPress={() => onPress(id, username)}
      style={s.container}>
      <Avatar
        src={avatarUrlMedium}
        size={50} />

      <View style={s.infoContainer}>
        <Text style={s.name}>{displayName}</Text>
        <Text style={s.userCount}>@{username}</Text>
      </View>
    </Button>

  )
}

SearchUserItem.propTypes = {
  displayName: PropTypes.string,
  username: PropTypes.string,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  avatarUrlMedium: PropTypes.string,
  onPress: PropTypes.func
}

export default SearchUserItem
