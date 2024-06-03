import { ITenant } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker//types'
import { svc } from '../main'
import TenantRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/tenant.repo'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { FeatureFlag, ILLMConsumableMember, ILLMConsumableOrganization } from '@crowd/types'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { logExecutionTime } from '@crowd/logging'

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
  suggestions: ILLMConsumableMember[] | ILLMConsumableOrganization[],
  modelId: string,
  prompt: string,
): Promise<string> {
  if (suggestions.length !== 2) {
    throw new Error('Exactly 2 suggestions are required for LLM comparison')
  }
  const client = new BedrockRuntimeClient({
    credentials: {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    region: process.env['CROWD_AWS_BEDROCK_REGION'],
  })

  const promptPrologue = `[INST] ${JSON.stringify(suggestions)} [/INST]`

  console.log('Prompt:', promptPrologue)

  const command = new InvokeModelCommand({
    body: JSON.stringify({
      prompt: `${promptPrologue} ${prompt}`,
      max_gen_len: 512,
      temperature: 0.5,
      top_p: 0.9,
    }),
    modelId,
    accept: 'application/json',
    contentType: 'application/json',
  })

  const res = await logExecutionTime(async () => client.send(command), svc.log, 'llm-invoke-model')

  return res.body.transformToString()
}
