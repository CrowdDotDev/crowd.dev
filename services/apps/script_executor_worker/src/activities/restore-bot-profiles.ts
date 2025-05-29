import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { IAttributes, IMember } from '@crowd/types'

import { svc } from '../main'

export async function getMembersManuallyMarkedAsBots(
  limit: number,
): Promise<Pick<IMember, 'id' | 'attributes' | 'manuallyChangedFields'>[]> {
  const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
  return memberRepo.getMembersManuallyMarkedAsBots(limit)
}

export async function updateMemberAttributesAndManuallyChangedFields(
  memberId: string,
  attributes: IAttributes,
  manuallyChangedFields: string[],
): Promise<void> {
  const memberRepo = new MemberRepository(svc.postgres.writer.connection(), svc.log)
  return memberRepo.updateMemberAttributesAndManuallyChangedFields(
    memberId,
    attributes,
    manuallyChangedFields,
  )
}
