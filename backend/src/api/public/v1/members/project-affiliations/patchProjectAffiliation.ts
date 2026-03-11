import type { Request, Response } from 'express'
import { z } from 'zod'

import { captureApiChange, memberEditAffiliationsAction } from '@crowd/audit-logs'
import { NotFoundError } from '@crowd/common'
import { CommonMemberService } from '@crowd/common_services'
import {
  MemberField,
  fetchMemberSegmentAffiliationForProject,
  findMemberById,
  optionsQx,
  updateMemberSegmentAffiliation,
} from '@crowd/data-access-layer'

import { ok } from '@/utils/api'
import { validateOrThrow } from '@/utils/validation'

const paramsSchema = z.object({
  memberId: z.uuid(),
  projectId: z.uuid(),
})

const bodySchema = z
  .object({
    organizationId: z.uuid().optional(),
    dateStart: z.coerce.date().nullable().optional(),
    dateEnd: z.coerce.date().nullable().optional(),
    verified: z.boolean().optional(),
    verifiedBy: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (data) => {
      const { dateStart, dateEnd } = data
      if (dateStart != null && dateEnd != null) {
        return dateEnd >= dateStart
      }
      return true
    },
    { message: 'dateEnd must be greater than or equal to dateStart' },
  )

export async function patchProjectAffiliation(req: Request, res: Response): Promise<void> {
  const { memberId, projectId } = validateOrThrow(paramsSchema, req.params)
  const data = validateOrThrow(bodySchema, req.body)

  const qx = optionsQx(req)

  const member = await findMemberById(qx, memberId, [MemberField.ID])

  if (!member) {
    throw new NotFoundError('Member not found')
  }

  const existing = await fetchMemberSegmentAffiliationForProject(qx, memberId, projectId)

  if (!existing) {
    throw new NotFoundError('Project affiliation not found')
  }

  let updated = existing

  await captureApiChange(
    req,
    memberEditAffiliationsAction(memberId, async (captureOldState, captureNewState) => {
      captureOldState(existing)

      await qx.tx(async (tx) => {
        await updateMemberSegmentAffiliation(tx, memberId, projectId, {
          ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
          ...(data.dateStart !== undefined && { dateStart: data.dateStart?.toISOString() ?? null }),
          ...(data.dateEnd !== undefined && { dateEnd: data.dateEnd?.toISOString() ?? null }),
          ...(data.verified !== undefined && { verified: data.verified }),
          ...(data.verifiedBy !== undefined && { verifiedBy: data.verifiedBy }),
        })

        const organizationId = data.organizationId ?? existing.organizationId
        if (organizationId) {
          const service = new CommonMemberService(tx, req.temporal, req.log)
          await service.startAffiliationRecalculation(memberId, [organizationId])
        }
      })

      updated = await fetchMemberSegmentAffiliationForProject(qx, memberId, projectId)
      if (!updated) {
        throw new Error('Failed to re-fetch project affiliation after update')
      }
      captureNewState(updated)
    }),
  )

  ok(res, {
    id: updated.id,
    organizationId: updated.organizationId,
    organizationName: updated.organizationName,
    organizationLogo: updated.organizationLogo ?? null,
    verified: updated.verified,
    verifiedBy: updated.verifiedBy ?? null,
    startDate: updated.dateStart ?? null,
    endDate: updated.dateEnd ?? null,
  })
}
