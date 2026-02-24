import type { Request, Response } from 'express'
import { z } from 'zod'

import { NotFoundError } from '@crowd/common'
import { fetchMemberIdentities, findMemberById, optionsQx } from '@crowd/data-access-layer'
import { MemberField } from '@crowd/data-access-layer/src/members/base'

import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
})

export async function getMemberIdentities(req: Request, res: Response): Promise<void> {
  const { memberId } = validateOrThrow(paramsSchema, req.params)
  const qx = optionsQx(req)

  const member = await findMemberById(qx, memberId, [MemberField.ID])

  if (!member) {
    throw new NotFoundError('Member profile not found')
  }

  const identities = await fetchMemberIdentities(qx, memberId)

  ok(res, { identities })
}
