import moment from 'moment'

export default {
  name: 'formatDate',
  implementation(value) {
    if (value) {
      return moment(value).format('YYYY-MM-DD')
    }

    return null
  }
}
