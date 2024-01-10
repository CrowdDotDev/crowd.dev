import { CubeJsService, CubeJsRepository } from '@crowd/cubejs'

import { InputAnalyticsWithTimes } from '../../types/analytics'
import moment from 'moment'

/*
totalMembersThisWeek is a Temporal activity that returns the total number of
members for a tenant as of this week from Cube.js.
*/
export async function getTotalMembersThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewMembers(
      cjs,
      moment.utc(input.unixEpoch),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalMembersPreviousWeek is a Temporal activity that returns the total number of
members for a tenant as of last week from Cube.js.
*/
export async function getTotalMembersPreviousWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewMembers(
      cjs,
      moment.utc(input.unixEpoch),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeMembersThisWeek is a Temporal activity that returns the number of active
members for a tenant for the current week from Cube.js.
*/
export async function getActiveMembersThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getActiveMembers(
      cjs,
      moment.utc(input.dateTimeStartThisWeek),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeMembersPreviousWeek is a Temporal activity that returns the number of active
members for a tenant for the past week from Cube.js.
*/
export async function getActiveMembersPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getActiveMembers(
      cjs,
      moment.utc(input.dateTimeStartPreviousWeek),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newMembersThisWeek is a Temporal activity that returns the number of new members
for a tenant for the current week from Cube.js.
*/
export async function getNewMembersThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewMembers(
      cjs,
      moment.utc(input.dateTimeStartThisWeek),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newMembersPreviousWeek is a Temporal activity that returns the number of new members
for a tenant for the past week from Cube.js.
*/
export async function getNewMembersPreviousWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewMembers(
      cjs,
      moment.utc(input.dateTimeStartPreviousWeek),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalOrganizationsThisWeek is a Temporal activity that returns the number of
organizations for a tenant as of the current week from Cube.js.
*/
export async function getTotalOrganizationsThisWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewOrganizations(
      cjs,
      moment.utc(input.unixEpoch),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalOrganizationsPreviousWeek is a Temporal activity that returns the number of
organizations for a tenant as of the past week from Cube.js.
*/
export async function getTotalOrganizationsPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewOrganizations(
      cjs,
      moment.utc(input.unixEpoch),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeOrganizationsThisWeek is a Temporal activity that returns the number of
active organizations for a tenant for the current week from Cube.js.
*/
export async function getActiveOrganizationsThisWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getActiveOrganizations(
      cjs,
      moment.utc(input.dateTimeStartThisWeek),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
activeOrganizationsPreviousWeek is a Temporal activity that returns the number of
active organizations for a tenant for the past week from Cube.js.
*/
export async function getActiveOrganizationsPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getActiveOrganizations(
      cjs,
      moment.utc(input.dateTimeStartPreviousWeek),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newOrganizationsThisWeek is a Temporal activity that returns the number of new
organizations for a tenant of the current from Cube.js.
*/
export async function getNewOrganizationsThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewOrganizations(
      cjs,
      moment.utc(input.dateTimeStartThisWeek),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newOrganizationsPreviousWeek is a Temporal activity that returns the number of new
organizations for a tenant of the past from Cube.js.
*/
export async function getNewOrganizationsPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewOrganizations(
      cjs,
      moment.utc(input.dateTimeStartPreviousWeek),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalActivitiesThisWeek is a Temporal activity that returns the number of total
activities for a tenant for the current week from Cube.js.
*/
export async function getTotalActivitiesThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewActivities(
      cjs,
      moment.utc(input.unixEpoch),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalActivitiesPreviousWeek is a Temporal activity that returns the number of
total activities for a tenant for the past week from Cube.js.
*/
export async function getTotalActivitiesPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewActivities(
      cjs,
      moment.utc(input.unixEpoch),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newActivitiesThisWeek is a Temporal activity that returns the number of new
activities for a tenant for the current week from Cube.js.
*/
export async function getNewActivitiesThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewActivities(
      cjs,
      moment.utc(input.dateTimeStartThisWeek),
      moment.utc(input.dateTimeEndThisWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newActivitiesPreviousWeek is a Temporal activity that returns the number of
new activities for a tenant for the past week from Cube.js.
*/
export async function getNewActivitiesPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  const cjs = new CubeJsService()
  await cjs.init(input.tenantId, input.segmentIds)

  let result: number
  try {
    result = await CubeJsRepository.getNewActivities(
      cjs,
      moment.utc(input.dateTimeStartPreviousWeek),
      moment.utc(input.dateTimeEndPreviousWeek),
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}
