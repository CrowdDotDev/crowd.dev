import { svc } from '../../main'
import {
  IOrganizationSegmentAggregates,
  getOrgAggregates,
} from '@crowd/data-access-layer/src/activities'
import { updateOrganizationSegments } from '@crowd/data-access-layer/src/org_segments'
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
    this.log.error(e, 'Failed to get organization aggregates!')
    throw e
  }

  return orgData
}

export async function storeOrgAggsInDb(orgData: IOrganizationSegmentAggregates): Promise<void> {
  try {
    const qx = new PgPromiseQueryExecutor(svc.postgres.writer.connection())
    await updateOrganizationSegments(qx, orgData as IOrganizationSegmentAggregates)
  } catch (e) {
    this.log.error(e, 'Failed to store organization aggregates!')
    throw e
  }
}
