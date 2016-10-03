import React, {PropTypes} from 'react';
import {View, Text} from 'react-native';
import s from '../../styles/screens/Drawer/ChannelListItemStyles'

import Avatar from '../Avatar'
import UnreadBadge from '../UnreadBadge'
import Button from '../Button'

import {createGhAvatarLink} from '../../utils/links'
import {THEMES} from '../../constants'
const {colors} = THEMES.gitterDefault

const ChannelListItem = ({
  id, name, oneToOne, user, activeRoom, onRoomPress,
  unreadItems, mentions, lurk, onLongRoomPress
}) => {
  const src = oneToOne
    ? createGhAvatarLink(user.username, 200)
    : createGhAvatarLink(name.split('/')[0], 200)

  const itemStyles = activeRoom === id
    ? {backgroundColor: colors.androidGray, color: colors.raspberry}
    : {backgroundColor: colors.white}

  return (
    <Button
      onPress={() => onRoomPress(id)}
      onLongPress={() => onLongRoomPress(id)}
      style={[s.container,
        {backgroundColor: itemStyles.backgroundColor}
      ]}
      key={id}>
      <Avatar
        src={src}
        size={30} />

      <View style={s.headingContainer}>
        <Text style={[s.heading, {color: itemStyles.color}]}>{name}</Text>
      </View>

      {(!!unreadItems || !!mentions || !!lurk) &&
        <UnreadBadge
          unreadItems={unreadItems}
          mentions={mentions}
          lurk={lurk} />}
    </Button>
  )
}

ChannelListItem.propTypes = {
  // id: PropTypes.stings,
  onLongRoomPress: PropTypes.func,
  name: PropTypes.string,
  oneToOne: PropTypes.bool,
  user: PropTypes.object,
  activeRoom: PropTypes.string,
  onRoomPress: PropTypes.func,
  unreadItems: PropTypes.number,
  mentions: PropTypes.number,
  lurk: PropTypes.bool
}

export default ChannelListItem
