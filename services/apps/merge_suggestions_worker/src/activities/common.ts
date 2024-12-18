/* eslint-disable @typescript-eslint/no-explicit-any */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import axios from 'axios'
import { performance } from 'perf_hooks'

import { ITenant } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker//types'
import LLMSuggestionVerdictsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/llmSuggestionVerdicts.repo'
import TenantRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/tenant.repo'
import { isFeatureEnabled } from '@crowd/feature-flags'
import {
  FeatureFlag,
  ILLMConsumableMember,
  ILLMConsumableOrganization,
  ILLMSuggestionVerdict,
} from '@crowd/types'

import { svc } from '../main'
import { ILLMResult } from '../types'

export async function getAllTenants(): Promise<ITenant[]> {
  const tenantRepository = new TenantRepository(svc.postgres.writer.connection(), svc.log)
  const tenants = await tenantRepository.getAllTenants()

  // map through the tenants array and resolve all promises
  const tenantPromises: Promise<boolean>[] = tenants.map(async (tenant) =>
    isFeatureEnabled(
      FeatureFlag.TEMPORAL_MEMBER_MERGE_SUGGESTIONS,
      async () => {
        return {
          tenantId: tenant.tenantId,
          plan: tenant.plan,
        }
      },
      svc.unleash,
    ),
  )

  // Wait for all promises to get resolved
  const tenantsEnabled = await Promise.all(tenantPromises)

  // Filter out tenants where the feature is not enabled
  return tenants.filter((_, index) => tenantsEnabled[index])
}

export async function getLLMResult(
  suggestion: ILLMConsumableMember[] | ILLMConsumableOrganization[],
  modelId: string,
  prompt: string,
  region: string,
  modelSpecificArgs: any,
): Promise<ILLMResult> {
  if (suggestion.length !== 2) {
    console.log(suggestion)
    throw new Error('Exactly 2 entities are required for LLM comparison')
  }
  const client = new BedrockRuntimeClient({
    credentials: {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    region,
  })

  const start = performance.now()

  const end = () => {
    const end = performance.now()
    const duration = end - start
    return Math.ceil(duration / 1000)
  }

  const fullPrompt = `Your task is to analyze the following two json documents. <json> ${JSON.stringify(
    suggestion,
  )} </json>. ${prompt}`

  const command = new InvokeModelCommand({
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: fullPrompt,
            },
          ],
        },
      ],
      ...modelSpecificArgs,
    }),
    modelId,
    accept: 'application/json',
    contentType: 'application/json',
  })

  const res = await client.send(command)

  return {
    body: JSON.parse(res.body.transformToString()),
    prompt: fullPrompt,
    modelSpecificArgs,
    responseTimeSeconds: end(),
  }
}

export async function saveLLMVerdict(verdict: ILLMSuggestionVerdict): Promise<string> {
  const llmVerdictRepository = new LLMSuggestionVerdictsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  return llmVerdictRepository.saveLLMVerdict(verdict)
}

export async function mergeMembers(
  primaryMemberId: string,
  secondaryMemberId: string,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${primaryMemberId}/merge`
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      memberToMerge: secondaryMemberId,
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed merging member wit status [${error.response?.status}]. Skipping!`)
  }
}

export async function mergeOrganizations(
  primaryOrganizationId: string,
  secondaryOrganizationId: string,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/organization/${primaryOrganizationId}/merge`
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      organizationToMerge: secondaryOrganizationId,
      segments: [],
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed merging organization with status [${error.response?.status}]. Skipping!`)
  }
}
