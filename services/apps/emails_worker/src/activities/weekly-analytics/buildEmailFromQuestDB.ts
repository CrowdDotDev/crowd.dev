import { IMember, IOrganization, PageData } from '@crowd/types'

import { svc } from '../../main'

import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'

import {
  IQueryActivityResult,
  findTopActivityTypes,
  queryActivities,
  ActivityType,
  findConversationsWithActivities,
  IConversationWithActivities,
  getDistinctActiveMembers,
  getDistinctActiveOrganizations,
  INumberOfActivitiesPerOrganization,
  INumberOfActivitiesPerMember,
  getMemberById,
  getOrganizationById,
} from '@crowd/data-access-layer'

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
    rows = await getDistinctActiveMembers(qdb, {
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
    members.push(await getMemberById(db, row.memberId))
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
    rows = await getDistinctActiveOrganizations(qdb, {
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
    orgs.push(await getOrganizationById(db, row.organizationId))
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
    const rows: INumberOfActivitiesPerMember[] = await getDistinctActiveMembers(qdb, {
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
    const rows: INumberOfActivitiesPerMember[] = await getDistinctActiveMembers(qdb, {
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
    const rows: INumberOfActivitiesPerOrganization[] = await getDistinctActiveOrganizations(qdb, {
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
    const rows: INumberOfActivitiesPerOrganization[] = await getDistinctActiveOrganizations(qdb, {
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
