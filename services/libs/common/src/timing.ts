import moment from 'moment-timezone'

import { IMemberOrganization } from '@crowd/types'

export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })

export const addSeconds = (date: Date, seconds: number): Date => {
  const newDate = new Date(date)
  newDate.setSeconds(newDate.getSeconds() + seconds)
  return newDate
}

export const EPOCH_DATE = new Date('1970-01-01T00:00:00+00:00')

export const getSecondsTillEndOfMonth = () => {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) // Set to last day of current month, at 23:59:59

  const diffInSeconds = (endOfMonth.getTime() - now.getTime()) / 1000
  return Math.round(diffInSeconds)
}

export function getEarliestValidDate(oldDate: Date, newDate: Date): Date {
  // If either the new or the old date are earlier than 1970
  // it means they come from an activity without timestamp
  // and we want to keep the other one
  if (moment(oldDate).subtract(5, 'days').unix() < 0) {
    return newDate
  }

  if (moment(newDate).unix() < 0) {
    return oldDate
  }

  return moment
    .min(moment.tz(oldDate, 'Europe/London'), moment.tz(newDate, 'Europe/London'))
    .toDate()
}

export const getLongestDateRange = <T extends IMemberOrganization>(orgs: T[]) => {
  const orgsWithDates = orgs.filter((row) => !!row.dateStart)
  if (orgsWithDates.length === 0) {
    // all orgs have no dates, return the first one
    return orgs[0]
  }

  const sortedByDateRange = orgsWithDates.sort((a, b) => {
    return (
      new Date(b.dateEnd || '9999-12-31').getTime() -
      new Date(b.dateStart).getTime() -
      (new Date(a.dateEnd || '9999-12-31').getTime() - new Date(a.dateStart).getTime())
    )
  })

  return sortedByDateRange[0]
}
