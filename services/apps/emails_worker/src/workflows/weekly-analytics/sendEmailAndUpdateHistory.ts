import { proxyActivities } from '@temporalio/workflow'
import moment from 'moment'

import * as activities from '../../activities'
import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'
import { getChangeAndDirection } from '../../utils/analytics'

// Configure timeouts and retry policies to fetch content from the databases.
const {
  getTenantUsers,
  getSegments,
  getTotalMembersThisWeek,
  getTotalMembersPreviousWeek,
  getNewMembersThisWeek,
  getNewMembersPreviousWeek,
  getTotalOrganizationsThisWeek,
  getTotalOrganizationsPreviousWeek,
  getNewOrganizationsThisWeek,
  getNewOrganizationsPreviousWeek,
  updateEmailHistory,
  getActiveTenantIntegrations,
  getTotalActivitiesThisWeek,
  getTotalActivitiesPreviousWeek,
  getNewActivitiesThisWeek,
  getNewActivitiesPreviousWeek,
  getMostActiveMembersThisWeek,
  getMostActiveOrganizationsThisWeek,
  getTopActivityTypes,
  getConversations,
  getActiveMembersThisWeek,
  getActiveMembersPreviousWeek,
  getActiveOrganizationsThisWeek,
  getActiveOrganizationsPreviousWeek,
} = proxyActivities<typeof activities>({ startToCloseTimeout: '10 seconds' })

// Configure timeouts and retry policies to actually send the email.
const { weeklySendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
})

/*
weeklySendEmailAndUpdateHistory is a Temporal workflow that:
  - [Activity]: Fetch the tenant's segments.
  - [Activity]: Ensure the tenant has an active integration.
  - [Async Activities]: Fetch results from database.
  - [Activity]: Fetch the tenant's users to have email addresses to send the
    email to.
  - [Activity]: Actually send the email to the each user's email address using
    the SendGrid API.
  - [Async Activities]: Update email history in the database.
*/
export async function weeklySendEmailAndUpdateHistory(
  input: InputAnalyticsWithTimes,
): Promise<void> {
  const segments = await getSegments(input)

  const withTimeAndSegmentIds: InputAnalyticsWithTimes = {
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    segmentIds: segments.map((subproject) => subproject.id),
    unixEpoch: input.unixEpoch,
    dateTimeEndThisWeek: input.dateTimeEndThisWeek,
    dateTimeStartThisWeek: input.dateTimeStartThisWeek,
    dateTimeEndPreviousWeek: input.dateTimeEndPreviousWeek,
    dateTimeStartPreviousWeek: input.dateTimeStartPreviousWeek,
  }

  const withTimeAndSegments: InputAnalyticsWithSegments = {
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    segmentIds: segments.map((subproject) => subproject.id),
    segments: segments,
    unixEpoch: input.unixEpoch,
    dateTimeEndThisWeek: input.dateTimeEndThisWeek,
    dateTimeStartThisWeek: input.dateTimeStartThisWeek,
    dateTimeEndPreviousWeek: input.dateTimeEndPreviousWeek,
    dateTimeStartPreviousWeek: input.dateTimeStartPreviousWeek,
  }

  // No need to conitnue if the tenant has no active integrations.
  const activeTenantIntegrations = await getActiveTenantIntegrations(withTimeAndSegments)
  if (activeTenantIntegrations.length == 0) {
    return
  }

  const [
    totalMembersThisWeek,
    totalMembersPreviousWeek,
    activeMembersThisWeek,
    activeMembersPreviousWeek,
    newMembersThisWeek,
    newMembersPreviousWeek,
    totalOrganizationsThisWeek,
    totalOrganizationsPreviousWeek,
    activeOrganizationsThisWeek,
    activeOrganizationsPreviousWeek,
    newOrganizationsThisWeek,
    newOrganizationsPreviousWeek,
    totalActivitiesThisWeek,
    totalActivitiesPreviousWeek,
    newActivitiesThisWeek,
    newActivitiesPreviousWeek,
    mostActiveMembersThisWeek,
    mostActiveOrganizationsThisWeek,
    topActivityTypes,
    conversations,
  ] = await Promise.all([
    getTotalMembersThisWeek(withTimeAndSegmentIds),
    getTotalMembersPreviousWeek(withTimeAndSegmentIds),
    getActiveMembersThisWeek(withTimeAndSegmentIds),
    getActiveMembersPreviousWeek(withTimeAndSegmentIds),
    getNewMembersThisWeek(withTimeAndSegmentIds),
    getNewMembersPreviousWeek(withTimeAndSegmentIds),
    getTotalOrganizationsThisWeek(withTimeAndSegmentIds),
    getTotalOrganizationsPreviousWeek(withTimeAndSegmentIds),
    getActiveOrganizationsThisWeek(withTimeAndSegmentIds),
    getActiveOrganizationsPreviousWeek(withTimeAndSegmentIds),
    getNewOrganizationsThisWeek(withTimeAndSegmentIds),
    getNewOrganizationsPreviousWeek(withTimeAndSegmentIds),
    getTotalActivitiesThisWeek(withTimeAndSegmentIds),
    getTotalActivitiesPreviousWeek(withTimeAndSegmentIds),
    getNewActivitiesThisWeek(withTimeAndSegmentIds),
    getNewActivitiesPreviousWeek(withTimeAndSegmentIds),
    getMostActiveMembersThisWeek(withTimeAndSegments),
    getMostActiveOrganizationsThisWeek(withTimeAndSegments),
    getTopActivityTypes(withTimeAndSegments),
    getConversations(withTimeAndSegments),
  ])

  const data = {
    dateRangePretty: `${moment.utc(input.dateTimeStartThisWeek).format('D MMM YYYY')} - ${moment
      .utc(input.dateTimeEndThisWeek)
      .format('D MMM YYYY')}`,
    members: {
      total: {
        value: totalMembersThisWeek,
        ...getChangeAndDirection(totalMembersThisWeek, totalMembersPreviousWeek),
      },
      new: {
        value: newMembersThisWeek,
        ...getChangeAndDirection(newMembersThisWeek, newMembersPreviousWeek),
      },
      active: {
        value: activeMembersThisWeek,
        ...getChangeAndDirection(activeMembersThisWeek, activeMembersPreviousWeek),
      },
      mostActive: mostActiveMembersThisWeek,
    },
    organizations: {
      total: {
        value: totalOrganizationsThisWeek,
        ...getChangeAndDirection(totalOrganizationsThisWeek, totalOrganizationsPreviousWeek),
      },
      new: {
        value: newOrganizationsThisWeek,
        ...getChangeAndDirection(newOrganizationsThisWeek, newOrganizationsPreviousWeek),
      },
      active: {
        value: activeOrganizationsThisWeek,
        ...getChangeAndDirection(activeOrganizationsThisWeek, activeOrganizationsPreviousWeek),
      },
      mostActive: mostActiveOrganizationsThisWeek,
    },
    activities: {
      total: {
        value: totalActivitiesThisWeek,
        ...getChangeAndDirection(totalActivitiesThisWeek, totalActivitiesPreviousWeek),
      },
      new: {
        value: newActivitiesThisWeek,
        ...getChangeAndDirection(newActivitiesThisWeek, newActivitiesPreviousWeek),
      },
      topActivityTypes,
    },
    conversations,
    tenant: {
      name: input.tenantName,
    },
  }

  const users = await getTenantUsers(withTimeAndSegments)
  await Promise.all(
    users.map((user) => {
      return weeklySendEmail({
        email: user.email,
        userId: user.userId,
        tenantId: input.tenantId,
        content: {
          ...data,
          user: {
            name: user.firstName,
          },
        },
      })
    }),
  )

  await updateEmailHistory({
    tenantId: input.tenantId,
    emails: users.map((user) => user.email),
    type: 'weekly-analytics',
    sentAt: new Date(),
    weekOfYear: moment().utc().startOf('isoWeek').subtract(7, 'days').isoWeek().toString(),
  })

  return
}
