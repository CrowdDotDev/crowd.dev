import {
  ActivityType,
  IConversationWithActivities,
  INumberOfActivitiesPerMember,
  INumberOfActivitiesPerOrganization,
  IQueryActivityResult,
  findConversationsWithActivities,
  findTopActivityTypes,
  getMemberById,
  getMostActiveMembers,
  getMostActiveOrganizations,
  queryActivities,
} from '@crowd/data-access-layer'
import { findOrgById } from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IMember, IOrganization, PageData } from '@crowd/types'

import { svc } from '../../main'
import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'

/* eslint-disable @typescript-eslint/no-explicit-any */

const db = svc.postgres.reader
const qdb = svc.questdbSQL

/*
totalActivitiesThisWeek is a Temporal activity that returns the number of total
activities for a tenant for the current week from QuestDB.
*/
export async function getTotalActivitiesThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: PageData<IQueryActivityResult>

  try {
    result = await queryActivities(qdb, {
      tenantId: input.tenantId,
      segmentIds: input.segmentIds,
      countOnly: true,
      filter: {
        and: [
          {
            timestamp: {
              gte: input.unixEpoch,
            },
          },
          {
            timestamp: {
              lte: input.dateTimeEndThisWeek,
            },
          },
        ],
      },
    })
  } catch (err) {
    throw new Error(err)
  }

  return result.count
}

/*
totalActivitiesPreviousWeek is a Temporal activity that returns the number of
total activities for a tenant for the past week from QuestDB.
*/
export async function getTotalActivitiesPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result: PageData<IQueryActivityResult>

  try {
    result = await queryActivities(qdb, {
      tenantId: input.tenantId,
      segmentIds: input.segmentIds,
      countOnly: true,
      filter: {
        and: [
          {
            timestamp: {
              gte: input.unixEpoch,
            },
          },
          {
            timestamp: {
              lte: input.dateTimeEndPreviousWeek,
            },
          },
        ],
      },
    })
  } catch (err) {
    throw new Error(err)
  }

  return result.count
}

/*
newActivitiesThisWeek is a Temporal activity that returns the number of new
activities for a tenant for the current week from QuestDB.
*/
export async function getNewActivitiesThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: PageData<IQueryActivityResult>

  try {
    result = await queryActivities(qdb, {
      tenantId: input.tenantId,
      segmentIds: input.segmentIds,
      countOnly: true,
      filter: {
        and: [
          {
            timestamp: {
              gte: input.dateTimeStartThisWeek,
            },
          },
          {
            timestamp: {
              lte: input.dateTimeEndThisWeek,
            },
          },
        ],
      },
    })
  } catch (err) {
    throw new Error(err)
  }

  return result.count
}

/*
newActivitiesPreviousWeek is a Temporal activity that returns the number of
new activities for a tenant for the past week from QuestDB.
*/
export async function getNewActivitiesPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result: PageData<IQueryActivityResult>

  try {
    result = await queryActivities(qdb, {
      tenantId: input.tenantId,
      segmentIds: input.segmentIds,
      countOnly: true,
      filter: {
        and: [
          {
            timestamp: {
              gte: input.dateTimeStartPreviousWeek,
            },
          },
          {
            timestamp: {
              lte: input.dateTimeEndPreviousWeek,
            },
          },
        ],
      },
    })
  } catch (err) {
    throw new Error(err)
  }

  return result.count
}

/*
getMostActiveMembersThisWeek is a Temporal activity that returns the tenant's most active
members for the current week.
*/
export async function getMostActiveMembersThisWeek(
  input: InputAnalyticsWithSegments,
): Promise<IMember[]> {
  let rows: INumberOfActivitiesPerMember[] = []

  try {
    rows = await getMostActiveMembers(qdb, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
      limit: 5,
    })
  } catch (err) {
    throw new Error(err)
  }

  const members: IMember[] = []
  for (const row of rows) {
    const member = await getMemberById(db, row.memberId)
    member.activityCount = rows.filter((row) => row.memberId === member.id)[0].count

    // Backward compatibility since the Sendgrid dynamic email template use "name"
    // and not "displayName".
    member.name = member.displayName

    members.push(member)
  }

  return members
}

/*
getMostActiveOrganizationsThisWeek is a Temporal activity that returns the tenant's most
active organizations for the current week.
*/
export async function getMostActiveOrganizationsThisWeek(
  input: InputAnalyticsWithSegments,
): Promise<IOrganization[]> {
  let rows: INumberOfActivitiesPerOrganization[] = []

  try {
    rows = await getMostActiveOrganizations(qdb, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
      limit: 5,
    })
  } catch (err) {
    throw new Error(err)
  }

  const orgs: IOrganization[] = []
  for (const row of rows) {
    const org = await findOrgById(dbStoreQx(db), row.organizationId)

    const data = org as any
    data.activityCount = rows.filter((row) => row.organizationId === org.id)[0].count

    // Backward compatibility since the Sendgrid dynamic email template use "name"
    // and not "displayName".
    data.name = org.displayName

    orgs.push(data)
  }

  return orgs
}

/*
getTopActivityTypes is a Temporal activity that returns the tenant's top activity
types for the current week.
*/
export async function getTopActivityTypes(
  input: InputAnalyticsWithSegments,
): Promise<ActivityType[]> {
  let types: ActivityType[]

  try {
    types = await findTopActivityTypes(qdb, {
      tenantId: input.tenantId,
      segments: input.segments,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
      limit: 5,
    })
  } catch (err) {
    throw new Error(err)
  }

  return types
}

/*
getConversations is a Temporal activity that returns the tenant's conversations
for the current week.
*/
export async function getConversations(
  input: InputAnalyticsWithSegments,
): Promise<IConversationWithActivities[]> {
  let result: IConversationWithActivities[]

  try {
    await findConversationsWithActivities(qdb, {
      tenantId: input.tenantId,
      segments: input.segments,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
      limit: 3,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeMembersThisWeek is a Temporal activity that returns the number of active
members for a tenant for the current week from QuestDB.
*/
export async function getActiveMembersThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result = 0

  try {
    const rows: INumberOfActivitiesPerMember[] = await getMostActiveMembers(qdb, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
    })

    result = rows.length
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeMembersPreviousWeek is a Temporal activity that returns the number of active
members for a tenant for the past week from QuestDB.
*/
export async function getActiveMembersPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result = 0

  try {
    const rows: INumberOfActivitiesPerMember[] = await getMostActiveMembers(qdb, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartPreviousWeek)),
      before: new Date(Date.parse(input.dateTimeEndPreviousWeek)),
    })

    result = rows.length
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeOrganizationsThisWeek is a Temporal activity that returns the number of
active organizations for a tenant for the current week from QuestDB.
*/
export async function getActiveOrganizationsThisWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result = 0

  try {
    const rows: INumberOfActivitiesPerOrganization[] = await getMostActiveOrganizations(qdb, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
    })

    result = rows.length
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeOrganizationsPreviousWeek is a Temporal activity that returns the number of
active organizations for a tenant for the past week from QuestDB.
*/
export async function getActiveOrganizationsPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result = 0

  try {
    const rows: INumberOfActivitiesPerOrganization[] = await getMostActiveOrganizations(qdb, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartPreviousWeek)),
      before: new Date(Date.parse(input.dateTimeEndPreviousWeek)),
    })

    result = rows.length
  } catch (err) {
    throw new Error(err)
  }

  return result
}
