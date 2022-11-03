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
export const formatDateToTimeAgo = (timestamp) => {
  return moment(timestamp).year() === 1970
    ? 'some time ago'
    : moment(timestamp).fromNow()
}

/**
 *
 * @param {string} timestamp
 * @param {number} subtractDays
 * @param {number} subtractMonths
 * @returns timestamp in YYYY-MM-DD format
 */
export const formatDate = ({
  timestamp = null,
  subtractDays,
  subtractMonths
}) => {
  const date = moment(timestamp)

  if (subtractDays) {
    date.subtract(subtractDays, 'days')
  }

  if (subtractMonths) {
    date.subtract(subtractMonths, 'months')
  }

  return date.format('YYYY-MM-DD')
}
