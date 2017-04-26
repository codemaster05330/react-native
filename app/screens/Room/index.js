import React, {Component, PropTypes} from 'react'
import {Keyboard, ActionSheetIOS, DrawerLayoutAndroid, ToastAndroid, Clipboard, Alert, ListView, View, Platform, KeyboardAvoidingView} from 'react-native';
import {connect} from 'react-redux'
import Share from 'react-native-share'
import navigationStyles from '../../styles/common/navigationStyles'
import _ from 'lodash'
import DrawerLayoutJs from 'react-native-drawer-layout'
const DrawerLayout = Platform.OS === 'ios' ? DrawerLayoutJs : DrawerLayoutAndroid
import moment from 'moment'
import BottomSheet from '../../../libs/react-native-android-bottom-sheet/index'
import Toolbar from '../../components/Toolbar'
import s from './styles'
import {quoteLink} from '../../utils/links'
import {THEMES} from '../../constants'
const {colors} = THEMES.gitterDefault

import {
  getRoom,
  selectRoom,
  joinRoom,
  changeFavoriteStatus,
  leaveRoom,
  markAllAsRead,
  getNotificationSettings,
  changeNotificationSettings
} from '../../modules/rooms'
import {
  getRoomMessages,
  prepareListView,
  getRoomMessagesBefore,
  getRoomMessagesIfNeeded,
  sendMessage,
  resendMessage,
  updateMessage,
  deleteFailedMessage,
  clearError as clearMessagesError,
  readMessages,
  sendStatusMessage
} from '../../modules/messages'
// import {
//   unsubscribeToChatMessages
// } from '../../modules/realtime'
import {changeRoomInfoDrawerState} from '../../modules/ui'

import RoomInfoScreen from '../RoomInfo'

import Loading from '../../components/Loading'
import MessagesList from './MessagesList'
import SendMessageField from './SendMessageField'
import JoinRoomField from './JoinRoomField'
import LoadingMoreSnack from '../../components/LoadingMoreSnack'
import FailedToLoad from '../../components/FailedToLoad'
import {iconsMap} from '../../utils/iconsMap'

const COMMAND_REGEX = /\/\S+/
const iOS = Platform.OS === 'ios'

class Room extends Component {
  constructor(props) {
    super(props)
    this.roomInfoDrawer = null
    this.readMessages = {}

    this.renderToolbar = this.renderToolbar.bind(this)
    this.renderListView = this.renderListView.bind(this)
    this.prepareDataSources = this.prepareDataSources.bind(this)
    this.onEndReached = this.onEndReached.bind(this)
    this.onSending = this.onSending.bind(this)
    this.onJoinRoom = this.onJoinRoom.bind(this)
    this.onMessageLongPress = this.onMessageLongPress.bind(this)
    this.onTextFieldChange = this.onTextFieldChange.bind(this)
    this.onRetryFetchingMessages = this.onRetryFetchingMessages.bind(this)
    this.handleToolbarActionSelected = this.handleToolbarActionSelected.bind(this)
    this.handleCopyToClipboard = this.handleCopyToClipboard.bind(this)
    this.handleUsernamePress = this.handleUsernamePress.bind(this)
    this.handleUserAvatarPress = this.handleUserAvatarPress.bind(this)
    this.renderRoomInfo = this.renderRoomInfo.bind(this)
    this.handleDialogPress = this.handleDialogPress.bind(this)
    this.handleQuotePress = this.handleQuotePress.bind(this)
    this.handleQuoteWithLinkPress = this.handleQuoteWithLinkPress.bind(this)
    this.onMessagePress = this.onMessagePress.bind(this)
    this.onResendingMessage = this.onResendingMessage.bind(this)
    this.handleChangeVisibleRows = this.handleChangeVisibleRows.bind(this)
    this.handleReadMessages = _.debounce(this.handleReadMessages.bind(this), 250)
    this.handleSendingMessage = this.handleSendingMessage.bind(this)
    this.handleSharingRoom = this.handleSharingRoom.bind(this)
    this.handleSharingMessage = this.handleSharingMessage.bind(this)

    this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));

    this.state = {
      textInputValue: '',
      editing: false,
      editMessage: {}
    }

    if (!iOS) {
      this.props.navigator.setButtons({
        leftButtons: [{
          title: 'Menu',
          id: 'drawerMenu',
          icon: iconsMap['menu-white'],
          iconColor: 'white',
          showAsAction: 'always'
        }]
      })
    }
  }

  componentWillMount() {
    const {navigator, room, title} = this.props
    this.prepareDataSources()
    navigator.setTitle({title})
    this.props.navigator.setButtons({
      rightButtons: this.getButtons(room, iOS)
    })
    Keyboard.dismiss()
  }

  componentDidMount() {
    this.prepareDataSources()
    const {activeRoom, rooms, route: { roomId }, dispatch, listViewData} = this.props
    // dispatch(subscribeToChatMessages(roomId))
    dispatch(changeRoomInfoDrawerState('close'))

    dispatch(clearMessagesError())
    if (activeRoom !== roomId) {
      dispatch(selectRoom(roomId))
    }
    if (!rooms[roomId]) {
      dispatch(getRoom(roomId))
    }
    dispatch(getNotificationSettings(roomId))
    if (!listViewData[roomId]) {
      dispatch(getRoomMessages(roomId))
    } else {
      dispatch(getRoomMessagesIfNeeded(roomId))
    }
  }

  componentWillReceiveProps({room, title}) {
    if (room !== this.props.room) {
      this.props.navigator.setTitle({title})
      this.props.navigator.setButtons({
        rightButtons: this.getButtons(room, iOS)
      })
    }
  }

  componentWillUnmount() {
    // const {dispatch, route: {roomId}} = this.props
    // dispatch(unsubscribeToChatMessages(roomId))
  }

  onNavigatorEvent(event) {
    if (event.type === 'NavBarButtonPress') {
      this.handleToolbarActionSelected(event)
    }
  }

  onEndReached() {
    const {dispatch, route: {roomId}, hasNoMore, isLoadingMore, isLoadingMessages, listViewData} = this.props
    if (hasNoMore[roomId] !== true && isLoadingMore === false
        && isLoadingMessages === false && listViewData[roomId].data.length !== 0) {
      dispatch(getRoomMessagesBefore(roomId))
    }
  }

  onSending() {
    if (this.state.editing) {
      this.onEndEdit()
    } else {
      this.handleSendingMessage(this.state.textInputValue)
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

  onMessagePress(id, rowId, messageText, failed) {
    const {currentUser, entities, rooms, route: {roomId}} = this.props
    const message = entities[id]
    let options

    if (failed) {
      options = {
        title: messageText,
        items: [
          'Retry',
          'Copy text',
          'Delete'
        ]
      }
    } else if (!rooms[roomId].roomMember) {
      options = {
        title: !!message.editedAt && !message.text ? 'This message was deleted' : message.text,
        items: [
          'Copy text',
          'Quote with link',
          'Share'
        ]
      }
    } else {
      options = {
        title: !!message.editedAt && !message.text ? 'This message was deleted' : message.text,
        items: [
          'Copy text',
          'Reply',
          'Quote',
          'Quote with link',
          'Share'
        ]
      }
      const experied = moment(message.sent).add(5, 'm')
      if (currentUser.username === message.fromUser.username &&
        moment().isBefore(experied) && !!message.text) {
        options.items.push('Edit', 'Delete')
      }
    }

    // TODO: Use BottomSheet/ActionSheet instead of Alert
    BottomSheet.showBotttomSheetWithOptions(options, (index, itemText) =>
      this.handleDialogPress(index, itemText, message, rowId, id, failed, messageText))
  }

  onMessageLongPress(messageId) {
    const {navigator, route: {roomId}} = this.props
    navigator.showModal({screen: 'gm.Message', passProps: {messageId, roomId}})
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

  onDeleteFailedMsg(rowId) {
    const {dispatch, route: {roomId}} = this.props
    dispatch(deleteFailedMessage(rowId, roomId))
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

  getButtons(room, onlyFiltered = false) {
    let actions = []

    if (iOS) {
      actions.push({
        title: 'More',
        icon: iconsMap['more-vert'],
        showAsAction: 'always',
        iconColor: 'white',
        id: 'showMoreIos',
        showInBottomSheet: false
      })
    }

    if (!!room && room.roomMember) {
      const newAction = [{
        title: 'Mark all as read',
        showAsAction: 'never',
        id: 'markAsRead',
        showInBottomSheet: true
      }, {
        title: 'Settings',
        showAsAction: 'never',
        id: 'settings',
        showInBottomSheet: true
      }, {
        title: 'Leave room',
        showAsAction: 'never',
        id: 'leave',
        showInBottomSheet: true
      }, {
        title: 'Share room',
        showAsAction: 'never',
        id: 'share',
        showInBottomSheet: true
      }, {
        title: room.hasOwnProperty('favourite') ? 'Remove from favorite' : 'Add to favorite',
        showAsAction: 'never',
        id: 'toggleFavorite',
        showInBottomSheet: true
      }, {
        title: 'Search',
        icon: iconsMap.search,
        showAsAction: 'always',
        iconColor: 'white',
        id: 'search',
        showInBottomSheet: true
      }]

      actions = actions.concat(newAction)
    }

    if (!!room) {
      actions.push({
        title: 'Open room info',
        icon: iconsMap['info-outline'],
        showAsAction: 'always',
        id: 'roomInfo',
        showInBottomSheet: false
      })
    }

    return onlyFiltered ? actions.filter(item => item.showInBottomSheet !== true) : actions
  }

  handleOverflowClick() {
    const {title, room} = this.props
    const actions = this.getButtons(room, false)

    const newActions = actions.map(({title, id}, index) => ({
      index,
      title,
      id
    }))

    const options = {
      options: newActions.map(i => i.title).concat('Close'),
      cancelButtonIndex: newActions.length,
      title
    }

    ActionSheetIOS.showActionSheetWithOptions(
      options,
      index => index === newActions.length
        ? () => {}
        : this.onNavigatorEvent({type: 'NavBarButtonPress', id: newActions[index].id})
    )
  }

  handleSendingMessage(text) {
    const {dispatch, route: {roomId}} = this.props

    const matches = text.match(COMMAND_REGEX)

    if (matches) {
      switch (matches[0]) {
      case '/me':
        dispatch(sendStatusMessage(roomId, text))
        break

      case '/notify-all':
        dispatch(changeNotificationSettings(roomId, 0))
        break

      case '/notify-announcements':
        dispatch(changeNotificationSettings(roomId, 1))
        break

      case '/notify-mute':
        dispatch(changeNotificationSettings(roomId, 2))
        break

      case '/mark-all-read':
        dispatch(markAllAsRead(roomId))
        break

      case '/fav':
        dispatch(changeFavoriteStatus(roomId))
        break

      case '/leave':
        this.leaveRoom()
        break
      default:
        dispatch(sendMessage(roomId, text))
        break
      }
    } else {
      dispatch(sendMessage(roomId, text))
    }
  }

  handleDialogPress(index, text, message, rowId, id, failed, messageText) {
    switch (text) {
    case 'Copy text':
      if (failed) {
        this.handleCopyToClipboard(messageText)
      } else {
        this.handleCopyToClipboard(message.text)
      }
      break
    case 'Edit':
      this.onEdit(rowId, id)
      break
    case 'Delete':
      if (failed) {
        this.onDeleteFailedMsg(rowId)
      } else {
        this.onDelete(rowId, id)
      }
      break
    case 'Quote':
      this.handleQuotePress(message)
      break
    case 'Quote with link':
      this.handleQuoteWithLinkPress(message)
      break
    case 'Reply':
      this.handleUsernamePress(message.fromUser.username)
      break
    case 'Retry':
      this.onResendingMessage(rowId, messageText)
      break

    case 'Share':
      this.handleSharingMessage(message)
      break
    default:
      break
    }
  }

  handleToolbarActionSelected({id}) {
    const {dispatch, route: {roomId}, navigator} = this.props
    switch (id) {
    case 'drawerMenu': return navigator.toggleDrawer({side: 'left', animated: true})
    case 'search': return navigator.showModal({screen: 'gm.SearchMessages', passProps: {roomId}})
    case 'roomInfo': return this.roomInfoDrawer.openDrawer()
    case 'toggleFavorite': return dispatch(changeFavoriteStatus(roomId))
    case 'markAsRead': return dispatch(markAllAsRead(roomId))
    case 'settings': return navigator.showModal({screen: 'gm.RoomSettings', passProps: {roomId}})
    case 'leave': return this.leaveRoom()
    case 'share': return this.handleSharingRoom(roomId)
    case 'showMoreIos': return this.handleOverflowClick()
    case 'back': return navigator.pop()
    default:
      break
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
    const {navigator} = this.props
    navigator.showModal({screen: 'gm.User', passProps: {userId: id, username}})
  }

  handleQuotePress(message) {
    const {textInputValue} = this.state
    this.setState({
      textInputValue: !!textInputValue ? `${textInputValue}\n> ${message.text}\n\n ` : `> ${message.text}\n\n `
    })
    this.refs.sendMessageField.focus()
  }

  handleQuoteWithLinkPress(message) {
    const {rooms, route} = this.props
    const room = rooms[route.roomId]
    const time = moment(message.sent).format('YYYY MMM D, HH:mm')
    const link = quoteLink(time, room.url, message.id)

    if (!rooms[route.roomId].roomMember) {
      Clipboard.setString(link)
      ToastAndroid.show('Copied quote link', ToastAndroid.SHORT)
      return
    }
    const {textInputValue} = this.state
    this.setState({
      textInputValue: !!textInputValue ? `${textInputValue}\n${link} ` : `${link} `
    })
    this.refs.sendMessageField.focus()
  }

  handleChangeVisibleRows(visibleRows, changedRows) {
    // const {dispatch, route: {roomId}} = this.props

    this.readMessages = Object.assign({}, this.readMessages, changedRows.s1)

    this.handleReadMessages()
  }

  handleReadMessages() {
    const {dispatch, route: {roomId}} = this.props
    if (!Object.keys(this.readMessages).length) {
      return
    }
    dispatch(readMessages(roomId, this.readMessages))

    this.readMessages = {}
  }

  handleSharingRoom(roomId) {
    const {rooms} = this.props
    const room = rooms[roomId]
    Share.open({
      url: `https://gitter.im${room.url}`,
      message: `Check out ${room.name} room`
    })
  }

  handleSharingMessage({sent, fromUser, id}) {
    const {rooms, route} = this.props
    const room = rooms[route.roomId]
    const time = moment(sent).format('YYYY MMM D, HH:mm')

    Share.open({
      url: `https://gitter.im${room.url}?at=${id}`,
      message: `Check out ${fromUser.username} message in ${room.name} room at ${time}`
    })
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
      const ds = new ListView.DataSource({rowHasChanged: (row1, row2) => {
        return row1 !== row2
      }})
      dispatch(prepareListView(roomId, ds.cloneWithRows([])))
    }
  }

  renderToolbar() {
    const {rooms, route} = this.props
    const room = rooms[route.roomId]
    let actions = []

    // TODO: Update one action instead

    let roomName = !!room ? room.name : ''
    roomName = roomName.split('/').reverse()[0]

    // return (
    //   <Toolbar
    //     navIconName={iOS ? 'arrow-back' : 'menu'}
    //     iconColor="white"
    //     onIconClicked={iOS ? this.onNavigateBack : this.props.onMenuTap}
    //     actions={actions}
    //     onActionSelected={this.handleToolbarActionSelected}
    //     overflowIconName="more-vert"
    //     title={roomName}
    //     titleColor="white"
    //     style={s.toolbar} />
    // )
  }

  renderBottom() {
    const {rooms, route: {roomId}} = this.props
    if (!rooms[roomId].roomMember) {
      return (
        <JoinRoomField
          onPress={this.onJoinRoom.bind(this)} />
      )
    }

    const field = (
      <SendMessageField
        ref="sendMessageField"
        onSending={this.onSending.bind(this)}
        onChange={this.onTextFieldChange.bind(this)}
        value={this.state.textInputValue} />
    )
    return iOS
      ? (
        <KeyboardAvoidingView
          behavior="padding">
          {field}
        </KeyboardAvoidingView>
      )
      : field
  }

  renderLoadingMore() {
    return (
      <LoadingMoreSnack loading/>
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
          onRetry={this.onRetryFetchingMessages.bind(this)} />
      )
    }
    return (
      <MessagesList
        onChangeVisibleRows={this.handleChangeVisibleRows}
        listViewData={listViewData[roomId]}
        onPress={this.onMessagePress.bind(this)}
        onLongPress={this.onMessageLongPress.bind(this)}
        onUsernamePress={this.handleUsernamePress.bind(this)}
        onUserAvatarPress={this.handleUserAvatarPress.bind(this)}
        dispatch={dispatch}
        onEndReached={this.onEndReached.bind(this)} />
    )
  }

  renderRoomInfo() {
    const {route, navigator} = this.props
    return (
      <RoomInfoScreen
        route={route}
        navigator={navigator}
        drawer={this.roomInfoDrawer} />
    )
  }

  render() {
    const {rooms, listViewData, route, isLoadingMessages,
      isLoadingMore, getMessagesError, dispatch} = this.props

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
          {this.renderLoading()}
        </View>
      )
    }

    const listView = listViewData[route.roomId]

    return (
      <View style={s.container}>
        <DrawerLayout
          ref={component => this.roomInfoDrawer = component}
          style={{backgroundColor: 'white'}}
          drawerWidth={300}
          onDrawerOpen={() => dispatch(changeRoomInfoDrawerState('open'))}
          onDrawerClose={() => dispatch(changeRoomInfoDrawerState('close'))}
          drawerPosition={DrawerLayout.positions.Right}
          renderNavigationView={this.renderRoomInfo}
          keyboardDismissMode="on-drag">
              {isLoadingMore ? this.renderLoadingMore() : null}
              {isLoadingMessages ? this.renderLoading() : this.renderListView()}
              {getMessagesError || isLoadingMessages || _.has(listView, 'data') &&
                listView.data.length === 0 ? null : this.renderBottom()}

        </DrawerLayout>
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
  getMessagesError: PropTypes.bool,
  roomInfoDrawerState: PropTypes.string,
  notifications: PropTypes.object,
  navigator: PropTypes.object
}

Room.navigatorStyle = {
  ...navigationStyles,
  collapsingToolBarImage: iconsMap['more-vert'],
  collapsingToolBarCollapsedColor: 'white'
}

function mapStateToProps(state, ownProps) {
  const {listView, isLoading, isLoadingMore, byRoom, hasNoMore, entities} = state.messages
  const {activeRoom, rooms, notifications} = state.rooms
  const {roomInfoDrawerState} = state.ui

  const room = rooms[ownProps.roomId]

  let title = !!room ? room.name : 'Room'
  title = title.split('/').reverse()[0]

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
    currentUser: state.viewer.user,
    roomInfoDrawerState,
    notifications,
    route: {roomId: ownProps.roomId},
    room,
    title
  }
}

export default connect(mapStateToProps)(Room)
