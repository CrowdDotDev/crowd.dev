import { svc } from '../main'

import {
  deleteMemberSegments,
  cleanupMember,
  findMemberById,
  moveActivitiesToNewMember,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'

export async function deleteMember(memberId: string): Promise<void> {
  await deleteMemberSegments(svc.postgres.writer, memberId)
  await cleanupMember(svc.postgres.writer, memberId)
}

export async function moveActivitiesBetweenMembers(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  const memberExists = await findMemberById(svc.postgres.writer, primaryId, tenantId)

  if (!memberExists) {
    return
  }
  await moveActivitiesToNewMember(svc.postgres.writer, primaryId, secondaryId, tenantId)
}
