import React, {
  PropTypes,
  View,
  Text,
  TouchableOpacity
} from 'react-native'
import s from '../../styles/screens/RoomInfo/RoomUserStyles'

import Avatar from '../Avatar'
import Heading from '../Heading'
import Button from '../Button'

const RoomUsers = ({ids, entities, onPress, userCount, onAllUsersPress, oneToOne}) => {
  const displayUserHeader = oneToOne === true ? 'People' : `People (${userCount})`
  let content = []

  if (ids.length >= 30) {
    for (let i = 0; i < 30; i++) {
      const id = ids[i]
      content.push(
        <TouchableOpacity
          onPress={() => onPress(id, entities[id].username)}
          id={id}>
          <View
            key={id}
            style={s.itemContainer}>
            <Avatar
              src={entities[id].avatarUrlSmall}
              size={40} />
          </View>
        </TouchableOpacity>
      )
    }
  } else {
    content = ids.map(id => (
      <TouchableOpacity
        onPress={() => onPress(id, entities[id].username)}
        id={id}>
        <View
          key={id}
          style={s.itemContainer}>
          <Avatar
            src={entities[id].avatarUrlSmall}
            size={40} />
        </View>
      </TouchableOpacity>
    ))
  }
  return (
    <View style={s.container}>
      <Heading
        text={displayUserHeader} />
      <View style={s.usersContainer}>
        {content}
      </View>
      {!oneToOne && (
        <View style={s.buttonsGroup}>
          <Button
            onPress={() => {}}
            styles={[s.button, s.primaryButton]}>
            <Text>Add</Text>
          </Button>
          <Button
            onPress={() => onAllUsersPress()}
            styles={s.button}>
            <Text>See all</Text>
          </Button>
        </View>
    )}
    </View>
  )
}

RoomUsers.propTypes = {
  ids: PropTypes.array,
  entities: PropTypes.object,
  onPress: PropTypes.func,
  userCount: PropTypes.number,
  onAllUsersPress: PropTypes.func,
  oneToOne: PropTypes.bool
}

export default RoomUsers
