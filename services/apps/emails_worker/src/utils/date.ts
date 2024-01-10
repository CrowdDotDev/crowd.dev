import moment from 'moment'

import {
  EagleEyePublishedDates,
  EagleEyeEmailDigestFrequency,
  EagleEyeEmailDigestSettings,
} from '@crowd/types'

export function switchDate(date: string, offset = 0) {
  let dateMoment: moment.Moment

  switch (date) {
    case EagleEyePublishedDates.LAST_24_HOURS:
      dateMoment = moment().subtract(1, 'days')
      break
    case EagleEyePublishedDates.LAST_7_DAYS:
      dateMoment = moment().subtract(7, 'days')
      break
    case EagleEyePublishedDates.LAST_14_DAYS:
      dateMoment = moment().subtract(14, 'days')
      break
    case EagleEyePublishedDates.LAST_30_DAYS:
      dateMoment = moment().subtract(30, 'days')
      break
    case EagleEyePublishedDates.LAST_90_DAYS:
      dateMoment = moment().subtract(90, 'days')
      break
    default:
      return null
  }

  return dateMoment.subtract(offset, 'days').format('YYYY-MM-DD')
}

export function nextEmailAt(settings: EagleEyeEmailDigestSettings): string {
  const now = moment()

  let nextEmailAt: string = ''
  const [hour, minute] = settings.time.split(':')
  const startOfWeek = moment()
    .startOf('isoWeek')
    .set('hour', parseInt(hour, 10))
    .set('minute', parseInt(minute, 10))
    .subtract(5, 'minutes')

  switch (settings.frequency) {
    case EagleEyeEmailDigestFrequency.DAILY:
      nextEmailAt = moment(settings.time, 'HH:mm').subtract(5, 'minutes').toISOString()

      // if send time has passed for today, set it to next day
      if (now > moment(settings.time, 'HH:mm')) {
        nextEmailAt = moment(nextEmailAt).add(1, 'day').toISOString()
      }
      break
    case EagleEyeEmailDigestFrequency.WEEKLY:
      nextEmailAt = startOfWeek.toISOString()

      // if send time has passed for this week, set it to next week
      if (now > startOfWeek) {
        nextEmailAt = startOfWeek.add(1, 'week').toISOString()
      }
      break
    default:
      throw new Error(`Unknown email digest frequency: ${settings.frequency}`)
  }

  return nextEmailAt
}
