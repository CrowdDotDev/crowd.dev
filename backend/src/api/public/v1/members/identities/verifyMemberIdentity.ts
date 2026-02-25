import type { Request, Response } from 'express'
import { z } from 'zod'

import { captureApiChange, memberVerifyIdentityAction } from '@crowd/audit-logs'
import { NotFoundError } from '@crowd/common'
import {
  deleteMemberIdentity,
  findMemberIdentityById,
  identityHasActivity,
  optionsQx,
  updateMemberIdentity,
} from '@crowd/data-access-layer'

import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
  identityId: z.uuid(),
})

const bodySchema = z.object({
  verified: z.boolean(),
  verifiedBy: z.string().optional(),
})

export async function verifyMemberIdentity(req: Request, res: Response): Promise<void> {
  const { memberId, identityId } = validateOrThrow(paramsSchema, req.params)
  const { verified, verifiedBy } = validateOrThrow(bodySchema, req.body)

  const qx = optionsQx(req)

  await qx.tx(async (tx) => {
    const identity = await findMemberIdentityById(tx, memberId, identityId)

    if (!identity) {
      throw new NotFoundError('Member identity not found')
    }

    await captureApiChange(
      req,
      memberVerifyIdentityAction(memberId, async (captureOldState, captureNewState) => {
        captureOldState(identity)

        await updateMemberIdentity(tx, memberId, identityId, {
          verified,
          verifiedBy,
        })

        if (!verified) {
          const hasActivity = await identityHasActivity(tx, identity.value, identity.platform)

          if (hasActivity) {
            // TODO: Decouple unmerge logic from MemberService.
            // We need a lower-level, transaction-aware implementation that accepts `tx`
            // so this verify flow remains fully atomic and avoids nested transactions.
          } else {
            await deleteMemberIdentity(tx, memberId, identityId)
          }
        }

        captureNewState({ ...identity, verified, verifiedBy })
      }),
    )
  })

  ok(res, { success: true })
}
