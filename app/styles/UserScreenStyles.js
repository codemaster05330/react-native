import {StyleSheet} from 'react-native'
import {THEMES} from '../constants'
const {colors} = THEMES.gitterDefault

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',

    flex: 1
  },
  toolbar: {
    height: 56,
    backgroundColor: colors.raspberry,
    elevation: 4
  }
})

export default styles
