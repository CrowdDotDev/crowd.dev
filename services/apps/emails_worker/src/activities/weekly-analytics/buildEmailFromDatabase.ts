import { SegmentRawData } from '@crowd/types'

import { svc } from '../../main'

import { UserTenant } from '../../types/user'
import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'

import {
  fetchSegments,
  fetchTenantUsers,
  fetchActiveIntegrations,
} from '@crowd/data-access-layer/src/old/apps/emails_worker/tenants'

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
