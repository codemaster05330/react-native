import {StyleSheet} from 'react-native'
const height = 48

const styles = StyleSheet.create({
  container: {
    height,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    margin: 8,
    backgroundColor: 'white',
    elevation: 2,
    borderRadius: 2
  },
  button: {
    elevation: 0,
    width: 56,
    height,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonIcon: {
    width: 25,
    height: 25,
    opacity: 0.6
  },
  innerContainer: {
    flex: 1,
    height,
    justifyContent: 'center'
  },
  textInput: {
    backgroundColor: 'white',
    fontSize: 18
  }
})

export default styles
