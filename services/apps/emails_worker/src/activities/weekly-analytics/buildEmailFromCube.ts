import moment from 'moment'

import { CubeJsService, CubeJsRepository } from '@crowd/cubejs'

import { InputAnalyticsWithTimes } from '../../types/analytics'

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
