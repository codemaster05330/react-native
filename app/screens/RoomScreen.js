import React, {
  Component,
  PropTypes,
  InteractionManager,
  ToolbarAndroid,
  ToastAndroid,
  Clipboard,
  Alert,
  ListView,
  View
} from 'react-native'
import {connect} from 'react-redux'
import moment from 'moment'
import _ from 'lodash'
import s from '../styles/screens/Room/RoomStyles'
import {THEMES} from '../constants'
const {colors} = THEMES.gitterDefault

import {getRoom, selectRoom, joinRoom, changeFavoriteStatus, leaveRoom} from '../modules/rooms'
import {
  getRoomMessages,
  prepareListView,
  getRoomMessagesBefore,
  getRoomMessagesIfNeeded,
  sendMessage,
  resendMessage,
  updateMessage,
  clearError as clearMessagesError
} from '../modules/messages'
import * as Navigation from '../modules/navigation'

import Loading from '../components/Loading'
import MessagesList from '../components/Room/MessagesList'
import SendMessageField from '../components/Room/SendMessageField'
import JoinRoomField from '../components/Room/JoinRoomField'
import LoadginMoreSnack from '../components/LoadingMoreSnack'
import FailedToLoad from '../components/FailedToLoad'

class Room extends Component {
  constructor(props) {
    super(props)
    this.renderToolbar = this.renderToolbar.bind(this)
    this.renderListView = this.renderListView.bind(this)
    this.prepareDataSources = this.prepareDataSources.bind(this)
    this.onEndReached = this.onEndReached.bind(this)
    this.onSending = this.onSending.bind(this)
    this.onResendingMessage = this.onResendingMessage.bind(this)
    this.onJoinRoom = this.onJoinRoom.bind(this)
    this.onMessageLongPress = this.onMessageLongPress.bind(this)
    this.onTextFieldChange = this.onTextFieldChange.bind(this)
    this.onRetryFetchingMessages = this.onRetryFetchingMessages.bind(this)
    this.handleToolbarActionSelected = this.handleToolbarActionSelected.bind(this)
    this.handleCopyToClipboard = this.handleCopyToClipboard.bind(this)
    this.handleUsernamePress = this.handleUsernamePress.bind(this)
    this.handleUserAvatarPress = this.handleUserAvatarPress.bind(this)

    this.state = {
      textInputValue: '',
      editing: false,
      editMessage: {}
    }
  }

  componentDidMount() {
    this.prepareDataSources()
    const {activeRoom, rooms, route: { roomId }, dispatch, listViewData} = this.props
    // dispatch(subscribeToChatMessages(roomId))

    InteractionManager.runAfterInteractions(() => {
      dispatch(clearMessagesError())
      if (activeRoom !== roomId) {
        dispatch(selectRoom(roomId))
      }
      if (!rooms[roomId]) {
        dispatch(getRoom(roomId))
      }
      if (!listViewData[roomId]) {
        dispatch(getRoomMessages(roomId))
      } else {
        dispatch(getRoomMessagesIfNeeded(roomId))
      }
    })
  }

  onEndReached() {
    const {dispatch, route: {roomId}, hasNoMore, isLoadingMore, isLoadingMessages, listViewData} = this.props
    if (hasNoMore[roomId] !== true && isLoadingMore === false
        && isLoadingMessages === false && listViewData[roomId].data.length !== 0) {
      dispatch(getRoomMessagesBefore(roomId))
    }
  }

  onSending() {
    const {dispatch, route: {roomId}} = this.props
    if (this.state.editing) {
      this.onEndEdit()
    } else {
      dispatch(sendMessage(roomId, this.state.textInputValue))
      this.setState({textInputValue: ''})
    }
  }

  onResendingMessage(rowId, text) {
    const {dispatch, route: {roomId}} = this.props
    dispatch(resendMessage(roomId, rowId, text))
  }

  onJoinRoom() {
    const {dispatch, route: {roomId}} = this.props
    Alert.alert(
      'Join room',
      'Are you sure?',
      [
        {text: 'Cancel', onPress: () => console.log('Cancel Pressed!')}, // eslint-disable-line no-console
        {text: 'OK', onPress: () => dispatch(joinRoom(roomId))}
      ]
    )
  }

  onMessageLongPress(rowId, id) {
    const {currentUser, entities} = this.props
    const message = entities[id]
    const experied = moment(message.sent).add(5, 'm')
    const countDown = ''

    const actions = [
      {text: 'Copy text', onPress: () => this.handleCopyToClipboard(message.text)}
    ]

    if (currentUser.username === message.fromUser.username &&
        moment().isBefore(experied) && !!message.text) {
      // time which's show editing experied time
      // setTimeout(() => {
      //   if (moment().isBefore(experied)) {
      //     const time = experied.subtract(moment()).format('mm:ss')
      //     countDown = `${time} to edit or delete`
      //   } else {
      //     countDown = `Can't edit or delete`
      //   }
      // }, 1000)
      actions.push(
        {text: 'Delete', onPress: () => this.onDelete(rowId, id)},
        {text: 'Edit', onPress: () => this.onEdit(rowId, id)}
      )
    }
    // TODO: Use BottomSheet/ActionSheet instead of Alert
    Alert.alert('Actions', countDown, actions)
  }

  onDelete(rowId, id) {
    const {dispatch, route: {roomId}, entities} = this.props
    const message = entities[id]
    const experied = moment(message.sent).add(5, 'm')

    if (moment().isAfter(experied)) {
      ToastAndroid.show("Can't delete message.", ToastAndroid.SHORT)
      return false
    }

    const text = ''
    dispatch(updateMessage(roomId, id, text))
  }

  onEdit(rowId, id) {
    const {entities} = this.props
    const message = entities[id]
    const experied = moment(message.sent).add(5, 'm')

    if (moment().isAfter(experied)) {
      this.setState({editing: false})
      return false
    }

    this.setState({
      textInputValue: message.text,
      editing: true,
      editMessage: {
        rowId, id
      }
    })

    // triggers two times because sometimes it won't focus
    setTimeout(() => this.refs.sendMessageField.focus(), 200)
  }

  onEndEdit() {
    const {dispatch, route: {roomId}, entities} = this.props
    const {textInputValue, editMessage: {id, rowId}} = this.state
    const message = entities[id]
    const experied = moment(message.sent).add(5, 'm')

    if (moment().isAfter(experied)) {
      this.setState({
        editing: false,
        textInputValue: '',
        editMessage: {}
      })
      this.refs.sendMessageField.blur()
      ToastAndroid.show("Can't edit message.", ToastAndroid.SHORT)
      return false
    }

    dispatch(updateMessage(roomId, id, textInputValue, rowId))
    this.refs.sendMessageField.blur()
    this.setState({
      editing: false,
      editMessage: {},
      textInputValue: ''
    })
  }

  onTextFieldChange(text) {
    this.setState({textInputValue: text})
  }

  onRetryFetchingMessages() {
    const {dispatch, route: {roomId}} = this.props
    dispatch(clearMessagesError())
    dispatch(getRoomMessages(roomId))
  }

  handleToolbarActionSelected(index) {
    const {dispatch, route: {roomId}} = this.props
    if (index === 0) {
      dispatch(changeFavoriteStatus(roomId))
    }
    if (index === 1) {
      this.leaveRoom()
    }
  }

  handleCopyToClipboard(text) {
    Clipboard.setString(text)
    ToastAndroid.show('Copied', ToastAndroid.SHORT)
  }

  handleUsernamePress(username) {
    const {textInputValue} = this.state
    this.setState({
      textInputValue: !!textInputValue ? `${textInputValue} @${username} ` : `@${username} `
    })
    this.refs.sendMessageField.focus()
  }

  handleUserAvatarPress(id, username) {
    const {dispatch} = this.props
    dispatch(Navigation.goTo({name: 'user', userId: id, username}))
  }

  leaveRoom() {
    const {dispatch, route: {roomId}} = this.props
    Alert.alert(
      'Leave room',
      'Are you sure?',
      [
        {text: 'Cancel', onPress: () => {}},
        {text: 'OK', onPress: () => dispatch(leaveRoom(roomId))}
      ]
    )
  }

  prepareDataSources() {
    const {listViewData, route: {roomId}, dispatch} = this.props
    if (!listViewData[roomId]) {
      const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => !_.isEqual(r1, r2)})
      dispatch(prepareListView(roomId, ds.cloneWithRows([])))
    }
  }

  renderToolbar() {
    const {rooms, route} = this.props
    const room = rooms[route.roomId]
    let actions = []

    // TODO: Update one action instead
    if (!!room && room.roomMember) {
      if (room.hasOwnProperty('favourite')) {
        actions = [{
          title: 'Remove from favorite',
          show: 'never'
        },
        {
          title: 'Leave room',
          show: 'never'
        }]
      } else {
        actions = [{
          title: 'Add to favorite',
          show: 'never'
        },
        {
          title: 'Leave room',
          show: 'never'
        }]
      }
    }

    return (
      <ToolbarAndroid
        navIcon={require('image!ic_menu_white_24dp')}
        onIconClicked={this.props.onMenuTap}
        actions={actions}
        onActionSelected={this.handleToolbarActionSelected}
        overflowIcon={require('image!ic_more_vert_white_24dp')}
        title={!!room ? room.name : ''}
        titleColor="white"
        style={s.toolbar} />
    )
  }

  renderBottom() {
    const {rooms, route: {roomId}} = this.props
    if (!rooms[roomId].roomMember) {
      return (
        <JoinRoomField
          onPress={this.onJoinRoom.bind(this)} />
      )
    }
    return (
      <SendMessageField
        ref="sendMessageField"
        onSending={this.onSending.bind(this)}
        onChange={this.onTextFieldChange.bind(this)}
        value={this.state.textInputValue} />
    )
  }

  renderLoadingMore() {
    return (
      <LoadginMoreSnack loading/>
    )
  }

  renderLoading() {
    return (
      <Loading color={colors.raspberry}/>
    )
  }

  renderListView() {
    const {listViewData, dispatch, route: {roomId}, getMessagesError} = this.props
    if (getMessagesError) {
      return (
        <FailedToLoad
          message="Failed to load messages."
          onPress={this.onRetryFetchingMessages.bind(this)} />
      )
    }
    return (
      <MessagesList
        listViewData={listViewData[roomId]}
        onResendingMessage={this.onResendingMessage.bind(this)}
        onLongPress={this.onMessageLongPress.bind(this)}
        onUsernamePress={this.handleUsernamePress.bind(this)}
        onUserAvatarPress={this.handleUserAvatarPress.bind(this)}
        dispatch={dispatch}
        onEndReached={this.onEndReached.bind(this)} />
    )
  }

  render() {
    const {rooms, listViewData, route, isLoadingMessages, isLoadingMore, getMessagesError} = this.props

    if (getMessagesError && !rooms[route.roomId]) {
      return (
        <FailedToLoad
          message="Failed to load room."
          onPress={this.componentDidMount.bind(this)} />
      )
    }

    if (!rooms[route.roomId]) {
      return (
        <View style={s.container}>
          {this.renderToolbar()}
          {this.renderLoading()}
        </View>
      )
    }

    const listView = listViewData[route.roomId]

    return (
      <View style={s.container}>
        {this.renderToolbar()}
        {isLoadingMore ? this.renderLoadingMore() : null}
        {isLoadingMessages ? this.renderLoading() : this.renderListView()}
        {getMessagesError || isLoadingMessages || _.has(listView, 'data') && listView.data.length === 0 ? null : this.renderBottom()}
      </View>
    )
  }
}

Room.propTypes = {
  activeRoom: PropTypes.string,
  rooms: PropTypes.object,
  onMenuTap: PropTypes.func,
  route: PropTypes.object,
  dispatch: PropTypes.func,
  isLoadingMessages: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  listViewData: PropTypes.object,
  byRoom: PropTypes.object,
  entities: PropTypes.object,
  hasNoMore: PropTypes.object,
  currentUser: PropTypes.object,
  getMessagesError: PropTypes.bool
}

function mapStateToProps(state) {
  const {listView, isLoading, isLoadingMore, byRoom, hasNoMore, entities} = state.messages
  const {activeRoom, rooms} = state.rooms
  return {
    activeRoom,
    rooms,
    entities,
    getMessagesError: state.messages.error,
    listViewData: listView,
    isLoadingMessages: isLoading,
    isLoadingMore,
    byRoom,
    hasNoMore,
    currentUser: state.viewer.user
  }
}

export default connect(mapStateToProps)(Room)
