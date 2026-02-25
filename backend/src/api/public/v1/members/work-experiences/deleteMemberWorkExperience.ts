import type { Request, Response } from 'express'
import { z } from 'zod'

import { captureApiChange, memberEditOrganizationsAction } from '@crowd/audit-logs'
import { NotFoundError } from '@crowd/common'
import { CommonMemberService } from '@crowd/common_services'
import {
  deleteMemberOrganizations,
  findMemberOrganizationById,
  optionsQx,
} from '@crowd/data-access-layer'

import { noContent } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
  workExperienceId: z.uuid(),
})

export async function deleteMemberWorkExperience(req: Request, res: Response): Promise<void> {
  const { memberId, workExperienceId } = validateOrThrow(paramsSchema, req.params)

  const qx = optionsQx(req)

  await qx.tx(async (tx) => {
    
    const workExperience = await findMemberOrganizationById(tx, workExperienceId)

    if (!workExperience) {
      throw new NotFoundError('Work experience not found')
    }

    await captureApiChange(
      req,
      memberEditOrganizationsAction(memberId, async (captureOldState, captureNewState) => {
        captureOldState(workExperience)
        await deleteMemberOrganizations(tx, memberId, [workExperienceId])

        const commonMemberService = new CommonMemberService(tx, req.temporal, req.log)
        await commonMemberService.startAffiliationRecalculation(memberId, [
          workExperience.organizationId,
        ])

        captureNewState(null)
      }),
    )
  })

  noContent(res)
}
