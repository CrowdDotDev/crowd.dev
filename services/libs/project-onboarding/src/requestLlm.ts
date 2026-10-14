import { LlmService } from '@crowd/common_services'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { LlmQueryType } from '@crowd/types'

import { OnboardingRequestLlm } from './requestParser'

const log = getServiceLogger()

export function createOnboardingRequestLlm(qx: QueryExecutor): OnboardingRequestLlm {
  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    log,
  )

  return async (prompt) => {
    const response = await llmService.queryLlm(
      LlmQueryType.ONBOARDING_REQUEST_PARSING,
      prompt,
      undefined,
      undefined,
      false,
    )
    return response?.answer
  }
}
