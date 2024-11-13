/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

import { LlmService } from '@crowd/common_services'
import { ITenant } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker//types'
import TenantRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/tenant.repo'
import { isFeatureEnabled } from '@crowd/feature-flags'
import {
  FeatureFlag,
  ILLMConsumableMember,
  ILLMConsumableOrganization,
  ILlmResult,
  LlmQueryType,
} from '@crowd/types'

import { svc } from '../main'

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
  type: LlmQueryType.MEMBER_MERGE | LlmQueryType.ORGANIZATION_MERGE,
  suggestion: ILLMConsumableMember[] | ILLMConsumableOrganization[],
): Promise<ILlmResult<boolean>> {
  const llmService = new LlmService(
    svc.postgres.writer,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  const result = await llmService.mergeSuggestion(type, suggestion)

  return result
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
    console.log(`Failed merging member wit status [${error.response.status}]. Skipping!`)
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
    console.log(`Failed merging organization with status [${error.response.status}]. Skipping!`)
  }
}
