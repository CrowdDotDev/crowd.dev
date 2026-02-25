import type { Request, Response } from 'express'
import { z } from 'zod'

import { captureApiChange, memberEditOrganizationsAction } from '@crowd/audit-logs'
import { CommonMemberService } from '@crowd/common_services'
import {
  changeMemberOrganizationAffiliationOverrides,
  checkOrganizationAffiliationPolicy,
  cleanSoftDeletedMemberOrganization,
  createMemberOrganization,
  findMemberOrganizationById,
  optionsQx,
} from '@crowd/data-access-layer'
import { IMemberOrganization } from '@crowd/types'

import { created } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
})

const bodySchema = z.object({
  organizationId: z.uuid(),
  jobTitle: z.string(),
  verified: z.boolean(),
  verifiedBy: z.string(),
  source: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
})

export async function createMemberWorkExperience(req: Request, res: Response): Promise<void> {
  const { memberId } = validateOrThrow(paramsSchema, req.params)
  const data = validateOrThrow(bodySchema, req.body)

  const qx = optionsQx(req)

  await qx.tx(async (tx) => {
    await captureApiChange(
      req,
      memberEditOrganizationsAction(memberId, async (captureOldState, captureNewState) => {
        captureOldState({})

        // convert data to IMemberOrganization
        const memberOrgData: IMemberOrganization = {
          memberId,
          organizationId: data.organizationId,
          title: data.jobTitle,
          dateStart: data.startDate,
          dateEnd: data.endDate,
          source: data.source,
          verified: data.verified,
          verifiedBy: data.verifiedBy,
        }

        // Clean up any soft-deleted entries
        await cleanSoftDeletedMemberOrganization(tx, memberId, memberOrgData.organizationId, data)

        // Create new member organization
        const newMemberOrgId = await createMemberOrganization(tx, memberId, memberOrgData)

        // Check if organization affiliation is blocked
        const isAffiliationBlocked = await checkOrganizationAffiliationPolicy(
          tx,
          memberOrgData.organizationId,
        )

        // If organization affiliation is blocked, create an affiliation override
        if (newMemberOrgId && isAffiliationBlocked) {
          await changeMemberOrganizationAffiliationOverrides(tx, [
            {
              memberId,
              memberOrganizationId: newMemberOrgId,
              allowAffiliation: false,
            },
          ])
        }

        const mo = await findMemberOrganizationById(tx, newMemberOrgId)

        const commonMemberService = new CommonMemberService(tx, req.temporal, req.log)
        await commonMemberService.startAffiliationRecalculation(memberId, [mo.organizationId])

        captureNewState(mo)
      }),
    )
  })

  created(res, { success: true })
}
