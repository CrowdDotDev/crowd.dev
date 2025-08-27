import { LlmService } from '@crowd/common_services'
import { pgpQx } from '@crowd/data-access-layer'
import {
  getAffiliationsLastCheckedAt as getAffiliationsLastCheckedAtDAL,
  getAllMemberIdsPaginated,
  getMemberIdsWithRecentRoleChanges,
  updateAffiliationsLastCheckedAt as updateAffiliationsLastCheckedAtOfTenant,
} from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import { ILlmResponse, LlmQueryType } from '@crowd/types'

import { svc } from '../main'

export async function getAffiliationsLastCheckedAt(): Promise<string> {
  return getAffiliationsLastCheckedAtDAL(svc.postgres.writer)
}

export async function getMemberIdsForAffiliationUpdates(
  affiliationsLastChecked: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  if (!affiliationsLastChecked) {
    return getAllMemberIdsPaginated(svc.postgres.writer, limit, offset)
  }

  return getMemberIdsWithRecentRoleChanges(
    svc.postgres.writer,
    affiliationsLastChecked,
    limit,
    offset,
  )
}

export async function updateAffiliationsLastCheckedAt(): Promise<void> {
  await updateAffiliationsLastCheckedAtOfTenant(svc.postgres.writer)
}

export async function getLLMResult(
  queryType: LlmQueryType,
  prompt: string,
  entityId: string,
  saveHistory = true,
  metadata?: Record<string, string>,
): Promise<ILlmResponse> {
  const qx = pgpQx(svc.postgres.writer.connection())
  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  return llmService.queryLlm(queryType, prompt, entityId, metadata, saveHistory)
}
