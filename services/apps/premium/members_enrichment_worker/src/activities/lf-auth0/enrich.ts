import { IAttributes, IMemberIdentity } from '@crowd/types'
import {
  getIdentitiesExistInOtherMembers as getIdentitiesExistInOthers,
  updateMemberAttributes,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { svc } from '../../main'
import { insertMemberIdentity } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker/normalize'

export async function getIdentitiesExistInOtherMembers(
  tenantId: string,
  excludeMemberId: string,
  identities: IMemberIdentity[],
): Promise<IMemberIdentity[]> {
  let rows: IMemberIdentity[] = []

  try {
    const db = svc.postgres.reader
    rows = await getIdentitiesExistInOthers(db, tenantId, excludeMemberId, identities)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

export async function enrich(
  memberId: string,
  tenantId: string,
  identities: IMemberIdentity[],
  attributes?: IAttributes,
): Promise<void> {
  try {
    await svc.postgres.writer.connection().tx(async (tx) => {
      for (const identity of identities) {
        console.log("Trying to insert identity:")
        console.log(identity)
        await insertMemberIdentity(
          tx,
          identity.platform,
          memberId,
          tenantId,
          identity.value,
          identity.type,
          identity.verified || false,
        )
      }
      if (attributes) {
        await updateMemberAttributes(tx, tenantId, memberId, attributes)
      }
    })
  } catch (err) {
    throw new Error(err)
  }
}
