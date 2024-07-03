import { svc } from '../../main'
import {
  IOrganizationSegmentAggregates,
  getOrgAggregates,
} from '@crowd/data-access-layer/src/activities'
import { updateOrganizationSegments } from '@crowd/data-access-layer/src/org_segments'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'

import { PgPromiseQueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

export async function getOrgIdsFromRedis(): Promise<string[]> {
  return await svc.redis.sMembers('computeOrgAggs')
}

export async function dropOrgIdFromRedis(orgId: string): Promise<void> {
  await svc.redis.sRem('computeOrgAggs', orgId)
}

export async function getOrgAggs(orgId: string): Promise<IOrganizationSegmentAggregates[]> {
  let orgData: IOrganizationSegmentAggregates[]

  try {
    const qx = new PgPromiseQueryExecutor(svc.postgres.writer.connection())
    orgData = await getOrgAggregates(qx, orgId)
  } catch (e) {
    this.log.error(e, 'Failed to get organization aggregate!')
    throw e
  }

  return orgData
}

export async function storeOrgAggsInDb(orgData: IOrganizationSegmentAggregates): Promise<void> {
  try {
    const qx = new PgPromiseQueryExecutor(svc.postgres.writer.connection())
    await updateOrganizationSegments(qx, orgData as IOrganizationSegmentAggregates)
  } catch (e) {
    this.log.error(e, 'Failed to store organization aggregate!')
    throw e
  }
}

export async function checkOrgExists(orgId: string): Promise<boolean> {
  let exists = false

  try {
    const repo = new OrganizationRepository(svc.postgres.writer, svc.log)
    exists = !!(await repo.checkOrganizationsExists([orgId]))
  } catch (e) {
    this.log.error(e, 'Failed to check if organization exists!')
  }

  return exists
}
