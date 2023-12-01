import moment from 'moment'

import { svc } from '../../main'

import { InputAnalytics, AnalyticsWithTimes } from '../../types/analytics'

/*
calculateTimes is a Temporal activity that calculates the time of the current
and past week, allowing to then be passed across all activities to retrieve
numbers of the current and past week.
*/
export async function calculateTimes(): Promise<AnalyticsWithTimes> {
  const unixEpoch = moment.unix(0)

  const dateTimeEndThisWeek = moment().utc().startOf('isoWeek')
  const dateTimeStartThisWeek = moment().utc().startOf('isoWeek').subtract(7, 'days')

  const dateTimeEndPreviousWeek = dateTimeStartThisWeek.clone()
  const dateTimeStartPreviousWeek = dateTimeStartThisWeek.clone().subtract(7, 'days')

  return {
    unixEpoch: unixEpoch.toISOString(),
    dateTimeEndThisWeek: dateTimeEndThisWeek.toISOString(),
    dateTimeStartThisWeek: dateTimeStartThisWeek.toISOString(),
    dateTimeEndPreviousWeek: dateTimeEndPreviousWeek.toISOString(),
    dateTimeStartPreviousWeek: dateTimeStartPreviousWeek.toISOString(),
  }
}

/*
weeklyGetNextEmails is a Temporal activity that fetches all users for a tenant.
*/
export async function weeklyGetNextEmails(): Promise<InputAnalytics[]> {
  let rows: InputAnalytics[] = []
  try {
    rows = await svc.postgres.reader.connection().query(`
      SELECT id as "tenantId", name as "tenantName"
      FROM tenants WHERE "deletedAt" IS NULL;
    `)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
