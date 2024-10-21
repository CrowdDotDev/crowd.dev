import SegmentRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/segment.repo'
import TenantRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/tenant.repo'
import { ISegment, ITenant } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag } from '@crowd/types'

import { svc } from '../main'

export async function getAllTenants(): Promise<ITenant[]> {
  const tenantRepository = new TenantRepository(svc.postgres.writer.connection(), svc.log)
  return tenantRepository.getAllTenants()
}

export async function getAllSegments(
  tenantId: string,
  limit: number,
  offset: number,
): Promise<ISegment[]> {
  const segmentRepository = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepository.getAllSegments(tenantId, limit, offset)
}

export async function getProjectLeafSegments(
  parentSlug: string,
  tenantId: string,
): Promise<ISegment[]> {
  const segmentRepository = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepository.getProjectLeafSegments(parentSlug, tenantId)
}

export async function getProjectGroupLeafSegments(
  grandparentSlug: string,
  tenantId: string,
): Promise<ISegment[]> {
  const segmentRepository = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepository.getProjectGroupLeafSegments(grandparentSlug, tenantId)
}

export async function isSegmentsEnabled(): Promise<boolean> {
  return isFeatureEnabled(FeatureFlag.SEGMENTS, null)
}
