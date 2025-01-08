import SegmentRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/segment.repo'
import { ISegment } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag } from '@crowd/types'

import { svc } from '../main'

export async function getAllSegments(
  limit: number,
  offset: number,
): Promise<ISegment[]> {
  const segmentRepository = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepository.getAllSegments(limit, offset)
}

export async function getProjectLeafSegments(
  parentSlug: string,
): Promise<ISegment[]> {
  const segmentRepository = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepository.getProjectLeafSegments(parentSlug)
}

export async function getProjectGroupLeafSegments(
  grandparentSlug: string,
): Promise<ISegment[]> {
  const segmentRepository = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepository.getProjectGroupLeafSegments(grandparentSlug)
}

export async function isSegmentsEnabled(): Promise<boolean> {
  return isFeatureEnabled(FeatureFlag.SEGMENTS, null)
}
