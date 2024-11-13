import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime'
import { performance } from 'perf_hooks'

import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import {
  ILLMConsumableMember,
  ILLMConsumableOrganization,
  ILlmResponse,
  ILlmResult,
  ILlmSettings,
  LLM_MODEL_PRICING_MAP,
  LLM_MODEL_REGION_MAP,
  LLM_SETTINGS,
  LlmQueryType,
} from '@crowd/types'

import { LlmPromptHistoryRepository } from '../repos/llmPromptHistory.repo'

export interface IBedrockClientCredentials {
  accessKeyId: string
  secretAccessKey: string
}

export class LlmService extends LoggerBase {
  private readonly repo: LlmPromptHistoryRepository
  private readonly clientRegionMap: Map<string, BedrockRuntimeClient>

  public constructor(
    store: DbStore,
    private readonly bedrockCredentials: IBedrockClientCredentials,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new LlmPromptHistoryRepository(store, this.log)
    this.clientRegionMap = new Map()
  }

  private client(settings: ILlmSettings): BedrockRuntimeClient {
    const region = LLM_MODEL_REGION_MAP[settings.modelId]

    let client: BedrockRuntimeClient
    if (this.clientRegionMap.has(region)) {
      client = this.clientRegionMap.get(region)
    } else {
      client = new BedrockRuntimeClient({
        credentials: {
          accessKeyId: this.bedrockCredentials.accessKeyId,
          secretAccessKey: this.bedrockCredentials.secretAccessKey,
        },
        region,
      })
      this.clientRegionMap.set(region, client)
    }

    return client
  }

  public async queryLlm(
    type: LlmQueryType,
    prompt: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
    saveHistory = true,
  ): Promise<ILlmResponse> {
    const settings = LLM_SETTINGS[type]
    if (!settings) {
      throw new Error(`No settings found for LLM query type: ${type}`)
    }

    const client = this.client(settings)

    const start = performance.now()
    const end = () => {
      const end = performance.now()
      const duration = end - start
      return Math.ceil(duration / 1000)
    }

    const command = new InvokeModelCommand({
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(settings.arguments as any),
      }),
      modelId: settings.modelId,
      accept: 'application/json',
      contentType: 'application/json',
    })

    let res: InvokeModelCommandOutput
    try {
      res = await client.send(command)
    } catch (err) {
      this.log.error(err, { settings, prompt }, 'Failed to query LLM!')
      throw err
    }

    const body = JSON.parse(res.body.transformToString())
    const responseTimeSeconds = end()

    const inputTokenCount = body.usage.input_tokens
    const outputTokenCount = body.usage.output_tokens
    const answer = body.content[0].text

    const pricing = LLM_MODEL_PRICING_MAP[settings.modelId]

    const inputCost = (inputTokenCount / 1000) * pricing.costPer1000InputTokens
    const outputCost = (outputTokenCount / 1000) * pricing.costPer1000OutputTokens
    const totalCost = inputCost + outputCost

    this.log.info({ type, entityId, inputCost, outputCost, totalCost }, 'Estimated LLM cost!')

    const result = {
      prompt,
      answer,
      inputTokenCount,
      outputTokenCount,
      responseTimeSeconds,
      model: settings.modelId,
    }

    if (saveHistory) {
      try {
        await this.repo.insertPromptHistoryEntry(type, settings.modelId, result, entityId, metadata)
      } catch (err) {
        this.log.error(err, 'Failed to save LLM prompt history entry!')
        throw err
      }
    }

    return result
  }

  public async consolidateMemberEnrichmentData(
    memberId: string,
    prompt: string,
  ): Promise<ILlmResult<string>> {
    const response = await this.queryLlm(LlmQueryType.MEMBER_ENRICHMENT, prompt, memberId)

    const result = response.answer

    return {
      result,
      ...response,
    }
  }

  public async mergeSuggestion(
    type: LlmQueryType.MEMBER_MERGE | LlmQueryType.ORGANIZATION_MERGE,
    suggestion: ILLMConsumableMember[] | ILLMConsumableOrganization[],
  ): Promise<ILlmResult<boolean>> {
    if (suggestion.length !== 2) {
      console.log(suggestion)
      throw new Error('Exactly 2 entities are required for LLM comparison')
    }

    const prompt = type === LlmQueryType.MEMBER_MERGE ? MEMBER_PROMPT : ORGANIZATION_PROMPT

    const fullPrompt = `Your task is to analyze the following two json documents. <json> ${JSON.stringify(
      suggestion,
    )} </json>. ${prompt}`

    const response = await this.queryLlm(type, fullPrompt, suggestion[0].id, {
      secondaryId: suggestion[1].id,
    })

    const result = response.answer === 'true'

    return {
      result,
      ...response,
    }
  }
}

const MEMBER_PROMPT = `Please compare and come up with a boolean answer if these two members are the same person or not. 
                  Only compare data from first member and second member. Never compare data from only one member with itself. 
                  Never tokenize 'platform' field using character tokenization. Use word tokenization for platform field in identities.
                  You should check all the sent fields between members to find similarities both literally and semantically. 
                  Here are the fields written with respect to their importance and how to check. Identities >> Organizations > Attributes and other fields >> Display name - 
                  1. Identities: Tokenize value field (identity.value) using character tokenization. Exact match or identities with edit distance <= 2 suggests that members are similar. 
                  Don't compare identities in a single member. Only compare identities between members. 
                  2. Organizations: Members are more likely to be the same when they have/had roles in similar organizations. 
                  If there are no intersecting organizations it doesn't necessarily mean that they're different members.
                  3. Attributes and other fields: If one member have a specific field and other member doesn't, skip that field when deciding similarity. 
                  Checking semantically instead of literally is important for such fields. Important fields here are: location, timezone, languages, programming languages. 
                  For example one member might have Berlin in location, while other can have Germany - consider such members have same location.  
                  4. Display Name: Tokenize using both character and word tokenization. When the display name is more than one word, and the difference is a few edit distances consider it a strong indication of similarity. 
                  When one display name is contained by the other, check other fields for the final decision. The same members on different platforms might have different display names. 
                  Display names can be multiple words and might be sorted in different order in different platforms for the same member.
                  Pro tip: If members have identities in the same platform (member1.identities[x].platform === member2.identities[y].platform) and if these identities have different usernames(member1.identities[x].value !== member2.identities[y].value) you can label them as different. 
                  Only do such labeling if both members have identities in the same platform. If they don't have identities in the same platform ignore the pro tip. 
                  Print 'true' if they are the same member, 'false' otherwise. No explanation required. Don't print anything else.`

const ORGANIZATION_PROMPT = `Please compare and come up with a boolean answer if these two organizations are the same organization or not. Print 'true' if they are the same organization, 'false' otherwise. No explanation required. Don't print anything else.`
