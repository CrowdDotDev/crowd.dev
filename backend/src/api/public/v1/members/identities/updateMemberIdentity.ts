import type { Request, Response } from 'express'
import { z } from 'zod'

import { NotFoundError } from '@crowd/common'
import { findMemberById, optionsQx } from '@crowd/data-access-layer'
import { MemberField } from '@crowd/data-access-layer/src/members/base'

import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
})

// const bodySchema = z.object({
//   verified: z.boolean(),
//   verifiedBy: z.string().optional(),
// })

export async function updateMemberIdentity(req: Request, res: Response): Promise<void> {
  const qx = optionsQx(req)

  const { memberId } = validateOrThrow(paramsSchema, req.params)

  const member = await findMemberById(qx, memberId, [MemberField.ID])

  if (!member) {
    throw new NotFoundError('Member profile not found')
  }

  // const { verified, verifiedBy } = validateOrThrow(bodySchema, req.body)

  // if verified is true, update the verified flag for the identity + verifiedBy source
  // if verified is false, then chcek if the identity has any activity, if it doesn't then soft delete
  // if it has activity, then unmerge the identity from the member

  ok(res, { success: true })
}
