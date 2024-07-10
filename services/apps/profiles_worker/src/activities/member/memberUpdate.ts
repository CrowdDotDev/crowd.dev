import { DbStore } from '@crowd/data-access-layer/src/database'
import { svc } from '../../main'
import { MemberWithIDOnly } from '../../types/member'
import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'

/*
updateMemberAffiliations is a Temporal activity that updates all affiliations for
a given member.
*/
export async function updateMemberAffiliations(input: MemberWithIDOnly): Promise<void> {
  try {
    await runMemberAffiliationsUpdate(
      svc.postgres.writer,
      new DbStore(svc.log, svc.questdbSQL),
      input.member.id,
    )
  } catch (err) {
    throw new Error(err)
  }
}
