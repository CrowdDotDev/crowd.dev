import moment from 'moment'

/**
 * Time ago utility
 *
 * This is a small wrapper of the moment(date).fromNow() method, to handle our data-related exception regarding
 * the year 1970, replacing the default label ("52 years ago") to "some time ago".
 *
 * @param timestamp
 * @returns {string|string}
 */
export default (timestamp) => {
  return moment(timestamp).year() === 1970
    ? 'some time ago'
    : moment(timestamp).fromNow()
}
