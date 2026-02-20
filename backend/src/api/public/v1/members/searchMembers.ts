import type { Request, Response } from 'express'
import { z } from 'zod'

import { ConflictError, NotFoundError } from '@crowd/common'
import { findMembersByIdentities, optionsQx } from '@crowd/data-access-layer'
import { IMemberIdentity, MemberIdentityType, PlatformType } from '@crowd/types'

import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const bodySchema = z.object({
  lfid: z.string().trim().min(1),
  emails: z.array(z.email()).optional(),
})

export async function searchMembers(req: Request, res: Response): Promise<void> {
  const { lfid, emails } = validateOrThrow(bodySchema, req.body)

  const qx = optionsQx(req)

  const identities: Partial<IMemberIdentity>[] = [
    { platform: PlatformType.LFID, value: lfid },
    ...(emails?.map((email) => ({ type: MemberIdentityType.EMAIL, value: email })) ?? []),
  ]

  const memberIds = await findMembersByIdentities(qx, identities)

  if (memberIds.length === 0) {
    throw new NotFoundError('Contributor profile not found!')
  } else if (memberIds.length > 1) {
    throw new ConflictError('Conflicting identities!')
  }

  const memberId = memberIds[0]

  ok(res, { memberId })
}
