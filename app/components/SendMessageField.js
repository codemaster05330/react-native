import React, {
  Component,
  PropTypes,
  TextInput,
  TouchableNativeFeedback,
  Image,
  View
} from 'react-native'
import s from '../styles/SendMessageFieldStyles'
import {THEMES} from '../constants'

const {colors} = THEMES.gitterDefault

export default class SendMessageField extends Component {
  constructor(props) {
    super(props)

    this.sendMessage = this.sendMessage.bind(this)
    this.focus = this.focus.bind(this)
    this.blur = this.blur.bind(this)
    this.onBlur = this.onBlur.bind(this)

    this.state = {
      height: 56
    }
  }

  // triggers when text input is blured
  // because the first one just will hide keyboard
  onBlur() {
    this.refs.textInput.blur()
  }

  focus() {
    this.refs.textInput.focus()
  }

  blur() {
    this.refs.textInput.blur()
  }

  sendMessage() {
    const {value, onSending} = this.props
    if (!value.trim()) {
      return
    }
    onSending()
    this.setState({height: 56})
  }

  render() {
    const {value, onChange} = this.props
    return (
      <View style={s.container}>
        <View style={s.innerContainer}>
          <TextInput
            ref="textInput"
            multiline
            style={[s.textInput, {height: this.state.height > 90 ? 90 : Math.max(56, this.state.height)}]}
            value={value}
            onBlur={this.onBlur}
            underlineColorAndroid={colors.androidGray}
            onChange={(event) => {
              this.setState({
                height: event.nativeEvent.contentSize.height
              })
              onChange(event.nativeEvent.text)
            }}
            placeholder="Type your message here..." />
        </View>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
          onPress={() => this.sendMessage()}>
          <View style={s.button}>
            <Image
              source={require('image!ic_send_black_24dp')}
              style={[s.sendIcon, {opacity: !value.trim() ? 0.2 : 0.6}]}/>
          </View>
        </TouchableNativeFeedback>
      </View>

    )
  }
}

SendMessageField.propTypes = {
  onSending: PropTypes.func,
  value: PropTypes.string,
  onChange: PropTypes.func
}
