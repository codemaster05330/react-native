import * as Api from '../api/gitter'
import _ from 'lodash'
import FayeGitter from '../../libs/react-native-gitter-faye'
import normalize from '../utils/normalize'
import {LOGOUT} from './auth'


/**
 * Constants
 */

export const CURRENT_USER_ROOMS = 'rooms/CURRENT_USER_ROOMS'
export const CURRENT_USER_ROOMS_RECEIVED = 'rooms/CURRENT_USER_ROOMS_RECEIVED'
export const CURRENT_USER_ROOMS_FAILED = 'rooms/CURRENT_USER_ROOMS_FAILED'
export const SUGGESTED_ROOMS = 'rooms/SUGGESTED_ROOMS'
export const SUGGESTED_ROOMS_RECEIVED = 'rooms/SUGGESTED_ROOMS_RECEIVED'
export const SUGGESTED_ROOMS_FAILED = 'rooms/SUGGESTED_ROOMS_FAILED'
export const SELECT_ROOM = 'rooms/SELECT_ROOM'
export const ROOMS_SUBSCRIBED = 'rooms/ROOMS_SUBSCRIBED'
export const ROOMS_UNSUBSCRIBED = 'rooms/ROOMS_UNSUBSCRIBED'
export const UPDATE_ROOM_STATE = 'rooms/UPDATE_ROOM_STATE'
export const ROOM = 'rooms/ROOM'
export const ROOM_RECEIVED = 'rooms/ROOM_RECEIVED'
export const ROOM_FAILED = 'rooms/ROOM_FAILED'


/**
 * Action Creators
 */

/**
 * Returns current user rooms by token
 */
export function getRooms() {
  return async (dispatch, getState) => {
    const {token} = getState().auth
    dispatch({type: CURRENT_USER_ROOMS})
    try {
      const payload = await Api.currentUserRooms(token)
      dispatch({type: CURRENT_USER_ROOMS_RECEIVED, payload})
    } catch (error) {
      dispatch({type: CURRENT_USER_ROOMS_FAILED, error})
    }
  }
}

/**
 * Return room by id
 */

export function getRoom(id) {
  return async (dispatch, getState) => {
    const {token} = getState().auth
    dispatch({type: ROOM})
    try {
      const payload = await Api.room(id, token)
      dispatch({type: ROOM_RECEIVED, payload})
    } catch (error) {
      dispatch({type: ROOM_FAILED, error})
    }
  }
}

/**
 * Returns suggested rooms by user id
 */
export function getSuggestedRooms() {
  return async (dispatch, getState) => {
    const {token} = getState().auth
    const {id} = getState().viewer.user

    dispatch({type: SUGGESTED_ROOMS})

    try {
      const payload = await Api.currentUserSuggested(token, id)
      dispatch({type: SUGGESTED_ROOMS_RECEIVED, payload})
    } catch (error) {
      dispatch({type: SUGGESTED_ROOMS_FAILED, error})
    }
  }
}

/**
 * Set active room
 */
export function selectRoom(roomId) {
  return {type: SELECT_ROOM, payload: roomId}
}

/**
 * Subscribe current user rooms changes (Drawer)
 */

export function subscribeToRooms() {
  return (dispatch, getState) => {
    const {id} = getState().viewer.user
    FayeGitter.subscribe(`/api/v1/user/${id}/rooms`)
    dispatch({type: ROOMS_SUBSCRIBED})
  }
}

/**
 * Update unread count by faye action
 */

export function updateRoomState(json) {
  return dispatch => {
    dispatch({type: UPDATE_ROOM_STATE, payload: json})
  }
}

/**
 * Reducer
 */

const initialState = {
  isLoading: false,
  ids: [],
  rooms: {},
  suggestedRooms: [],
  activeRoom: '',
  error: false,
  errors: {}
}

export default function rooms(state = initialState, action) {
  switch (action.type) {
  case ROOM:
  case SUGGESTED_ROOMS:
  case CURRENT_USER_ROOMS: {
    return {...state,
      isLoading: true
    }
  }

  case CURRENT_USER_ROOMS_RECEIVED: {
    const normalized = normalize(action.payload)
    return {...state,
      isLoading: false,
      ids: normalized.ids,
      rooms: normalized.entities
    }
  }

  case ROOM_RECEIVED: {
    const {id} = action.payload
    return {...state,
      isLoading: false,
      ids: state.ids.concat(id),
      rooms: {...state.rooms,
        [id]: action.payload
      }
    }
  }

  case SUGGESTED_ROOMS_RECEIVED: {
    return {...state,
      isLoading: false,
      suggestedRooms: action.payload
    }
  }

  case SELECT_ROOM: {
    return {...state,
      activeRoom: action.payload
    }
  }

  case UPDATE_ROOM_STATE: {
    const {id} = action.payload.model
    const room = state.rooms[id]
    return {...state,
      rooms: {...state.rooms,
        [id]: _.merge(room, action.payload.model)
      }
    }
  }

  case LOGOUT: {
    return initialState
  }

  case ROOM_FAILED:
  case SUGGESTED_ROOMS_FAILED:
  case CURRENT_USER_ROOMS_FAILED: {
    return {...state,
      isLoading: false,
      error: true,
      errors: action.error
    }
  }
  default:
    return state
  }
}
