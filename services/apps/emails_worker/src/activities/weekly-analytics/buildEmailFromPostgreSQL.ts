import { SegmentRawData } from '@crowd/types'

import { svc } from '../../main'

import { UserTenant } from '../../types/user'
import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'

import {
  fetchSegments,
  fetchTenantUsers,
  fetchActiveIntegrations,
} from '@crowd/data-access-layer/src/old/apps/emails_worker/tenants'
import { getNumberOfNewMembers } from '@crowd/data-access-layer'
import { getNumberOfNewOrganizations } from '@crowd/data-access-layer/src/organizations'

const db = svc.postgres.reader

/*
getSegments is a Temporal activity that returns the tenant's segments.
*/
export async function getSegments(input: InputAnalyticsWithTimes): Promise<SegmentRawData[]> {
  let rows: SegmentRawData[]

  try {
    rows = await fetchSegments(db, input.tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

/*
getTenantUsers is a Temporal activity that returns the tenant's users.
*/
export async function getTenantUsers(input: InputAnalyticsWithTimes): Promise<UserTenant[]> {
  let rows: UserTenant[]

  try {
    rows = await fetchTenantUsers(db, input.tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

/*
getActiveTenantIntegrations is a Temporal activity that returns the tenant's
active integrations, useful to know if it's required to send a weekly email or
not.
*/
export async function getActiveTenantIntegrations(
  input: InputAnalyticsWithSegments,
): Promise<object[]> {
  let integrations: object[]

  try {
    integrations = await fetchActiveIntegrations(db, input.tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return integrations
}

/*
totalMembersThisWeek is a Temporal activity that returns the total number of
members for a tenant as of this week.
*/
export async function getTotalMembersThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewMembers(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.unixEpoch)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalMembersPreviousWeek is a Temporal activity that returns the total number of
members for a tenant as of last week.
*/
export async function getTotalMembersPreviousWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewMembers(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.unixEpoch)),
      before: new Date(Date.parse(input.dateTimeEndPreviousWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newMembersThisWeek is a Temporal activity that returns the number of new members
for a tenant for the current week.
*/
export async function getNewMembersThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewMembers(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newMembersPreviousWeek is a Temporal activity that returns the number of new members
for a tenant for the past week.
*/
export async function getNewMembersPreviousWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewMembers(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartPreviousWeek)),
      before: new Date(Date.parse(input.dateTimeEndPreviousWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalOrganizationsThisWeek is a Temporal activity that returns the number of
organizations for a tenant as of the current week.
*/
export async function getTotalOrganizationsThisWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewOrganizations(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.unixEpoch)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
totalOrganizationsPreviousWeek is a Temporal activity that returns the number of
organizations for a tenant as of the past week.
*/
export async function getTotalOrganizationsPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewOrganizations(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.unixEpoch)),
      before: new Date(Date.parse(input.dateTimeEndPreviousWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newOrganizationsThisWeek is a Temporal activity that returns the number of new
organizations for a tenant of the current.
*/
export async function getNewOrganizationsThisWeek(input: InputAnalyticsWithTimes): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewOrganizations(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartThisWeek)),
      before: new Date(Date.parse(input.dateTimeEndThisWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

/*
newOrganizationsPreviousWeek is a Temporal activity that returns the number of new
organizations for a tenant of the past.
*/
export async function getNewOrganizationsPreviousWeek(
  input: InputAnalyticsWithTimes,
): Promise<number> {
  let result: number

  try {
    result = await getNumberOfNewOrganizations(db, {
      tenantId: input.tenantId,
      after: new Date(Date.parse(input.dateTimeStartPreviousWeek)),
      before: new Date(Date.parse(input.dateTimeEndPreviousWeek)),
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}
