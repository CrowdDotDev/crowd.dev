import moment from 'moment'
import config from '@/config'

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
  subtractMonths,
  subtractYears
}) => {
  const date = timestamp ? moment(timestamp) : moment()

  if (subtractDays) {
    date.subtract(subtractDays, 'days')
  }

  if (subtractMonths) {
    date.subtract(subtractMonths, 'months')
  }

  if (subtractYears) {
    date.subtract(subtractYears, 'years')
  }

  return date.format('YYYY-MM-DD')
}

export const getTrialDate = (tenant) => {
  if (config.isCommunityVersion || !tenant.isTrialPlan) {
    return null
  }

  const daysLeft = moment(tenant.trialEndsAt).diff(
    moment(),
    'days'
  )

  return `Trial (${daysLeft < 0 ? 0 : daysLeft} days left)`
}
