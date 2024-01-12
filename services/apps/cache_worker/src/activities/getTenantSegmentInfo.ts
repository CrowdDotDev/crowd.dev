import { ISegment, ITenant } from 'types'
import { svc } from '../main'
import TenantRepository from 'repo/tenant.repo'
import SegmentRepository from 'repo/segment.repo'

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