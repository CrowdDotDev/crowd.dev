import { DEFAULT_TENANT_ID } from '@crowd/common'
import {
  getIdentitiesExistInOtherMembers as getIdentitiesExistInOthers,
  updateMemberAttributes,
} from '@crowd/data-access-layer/src/old/apps/members_enrichment_worker'
import { insertMemberIdentity } from '@crowd/data-access-layer/src/old/apps/members_enrichment_worker/normalize'
import { IAttributes, IMemberIdentity } from '@crowd/types'

import { svc } from '../../service'

export async function getIdentitiesExistInOtherMembers(
  excludeMemberId: string,
  identities: IMemberIdentity[],
): Promise<IMemberIdentity[]> {
  let rows: IMemberIdentity[] = []

  try {
    const db = svc.postgres.reader
    rows = await getIdentitiesExistInOthers(db, excludeMemberId, identities)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

export async function updateMemberWithEnrichmentData(
  memberId: string,
  identities: IMemberIdentity[],
  attributes?: IAttributes,
): Promise<void> {
  try {
    await svc.postgres.writer.connection().tx(async (tx) => {
      for (const identity of identities) {
        await insertMemberIdentity(
          tx,
          identity.platform,
          memberId,
          identity.value,
          identity.type,
          identity.verified || false,
        )
      }
      if (attributes) {
        await updateMemberAttributes(tx, memberId, attributes)
      }
    })
  } catch (err) {
    throw new Error(err)
  }
}

export async function mergeMembers(
  primaryMemberId: string,
  secondaryMemberId: string,
): Promise<void> {
  const res = await fetch(
    `${process.env['CROWD_API_SERVICE_URL']}/tenant/${DEFAULT_TENANT_ID}/member/${primaryMemberId}/merge`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberToMerge: secondaryMemberId,
      }),
    },
  )

  if (res.status !== 200) {
    throw new Error(`Failed to merge member ${primaryMemberId} with ${secondaryMemberId}!`)
  }
}
