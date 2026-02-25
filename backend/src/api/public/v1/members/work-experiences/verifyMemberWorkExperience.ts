import type { Request, Response } from 'express'
import { z } from 'zod'

import { captureApiChange, memberVerifyWorkExperienceAction } from '@crowd/audit-logs'
import { NotFoundError } from '@crowd/common'
import { CommonMemberService } from '@crowd/common_services'
import {
  deleteMemberOrganizations,
  findMemberOrganizationById,
  optionsQx,
  updateMemberOrganization,
} from '@crowd/data-access-layer'

import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
  workExperienceId: z.uuid(),
})

const bodySchema = z.object({
  verified: z.boolean(),
  verifiedBy: z.string().optional(),
})

export async function verifyMemberWorkExperience(req: Request, res: Response): Promise<void> {
  const { memberId, workExperienceId } = validateOrThrow(paramsSchema, req.params)
  const { verified, verifiedBy } = validateOrThrow(bodySchema, req.body)

  const qx = optionsQx(req)

  await qx.tx(async (tx) => {
    const mo = await findMemberOrganizationById(tx, workExperienceId)

    if (!mo) {
      throw new NotFoundError('Member work experience not found')
    }

    await captureApiChange(
      req,
      memberVerifyWorkExperienceAction(memberId, async (captureOldState, captureNewState) => {
        captureOldState(mo)

        await updateMemberOrganization(tx, memberId, workExperienceId, {
          verified,
          verifiedBy,
        })

        if (!verified) {
          await deleteMemberOrganizations(tx, memberId, [workExperienceId])

          const commonMemberService = new CommonMemberService(tx, req.temporal, req.log)
          await commonMemberService.startAffiliationRecalculation(memberId, [mo.organizationId])
        }

        captureNewState({ ...mo, verified, verifiedBy })
      }),
    )
  })

  ok(res, { success: true })
}
