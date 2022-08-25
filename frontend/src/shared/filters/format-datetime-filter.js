import moment from 'moment'

export default {
  name: 'formatDatetime',
  implementation(value) {
    if (value) {
      return moment(value).format('YYYY-MM-DD HH:mm')
    }

    return null
  }
}
