import { LlmModelType, LlmQueryType } from './enums'

export interface ILlmHistoryEntry extends ILlmResponse {
  type: LlmQueryType
  entityId?: string
  metadata?: Record<string, unknown>
}

export interface ILlmResponse {
  model: LlmModelType
  prompt: string
  answer: string
  inputTokenCount: number
}

export interface ILlmResult<T> extends ILlmResponse {
  result: T
}

export interface ILlmSettings {
  modelId: LlmModelType
  arguments: unknown
}

export interface ILlmPricing {
  costPer1000InputTokens: number
  costPer1000OutputTokens: number
}

export const LLM_MODEL_REGION_MAP: Record<LlmModelType, string> = {
  [LlmModelType.CLAUDE_3_OPUS]: 'us-west-2',
  [LlmModelType.CLAUDE_3_5_SONNET]: 'us-east-1',
  [LlmModelType.CLAUDE_3_5_SONNET_V2]: 'us-west-2',
}

// to estimate costs - these numbers can change
export const LLM_MODEL_PRICING_MAP: Record<LlmModelType, ILlmPricing> = {
  [LlmModelType.CLAUDE_3_OPUS]: {
    costPer1000InputTokens: 0.015,
    costPer1000OutputTokens: 0.075,
  },
  [LlmModelType.CLAUDE_3_5_SONNET]: {
    costPer1000InputTokens: 0.003,
    costPer1000OutputTokens: 0.015,
  },
  [LlmModelType.CLAUDE_3_5_SONNET_V2]: {
    costPer1000InputTokens: 0.003,
    costPer1000OutputTokens: 0.015,
  },
}

export const LLM_SETTINGS: Record<LlmQueryType, ILlmSettings> = {
  [LlmQueryType.MEMBER_ENRICHMENT]: {
    modelId: LlmModelType.CLAUDE_3_5_SONNET,
    arguments: {
      max_tokens: 200000,
      anthropic_version: 'bedrock-2023-05-31',
      temperature: 0,
    },
  },
  [LlmQueryType.MEMBER_ENRICHMENT_FIND_RELATED_LINKEDIN_PROFILES]: {
    modelId: LlmModelType.CLAUDE_3_5_SONNET_V2,
    arguments: {
      max_tokens: 200000,
      anthropic_version: 'bedrock-2023-05-31',
      temperature: 0,
    },
  },
  [LlmQueryType.MEMBER_ENRICHMENT_SQUASH_MULTIPLE_VALUE_ATTRIBUTES]: {
    modelId: LlmModelType.CLAUDE_3_5_SONNET_V2,
    arguments: {
      max_tokens: 200000,
      anthropic_version: 'bedrock-2023-05-31',
      temperature: 0,
    },
  },
  [LlmQueryType.MEMBER_ENRICHMENT_SQUASH_WORK_EXPERIENCES_FROM_MULTIPLE_SOURCES]: {
    modelId: LlmModelType.CLAUDE_3_5_SONNET_V2,
    arguments: {
      max_tokens: 200000,
      anthropic_version: 'bedrock-2023-05-31',
      temperature: 0,
    },
  },
}

export interface LlmIdentity {
  t: string // type
  v: string // value
  p: string // platform
  ve: boolean // verification status
}

export interface LlmOrganizationConnection {
  orgId: string
  t: string // title
  ds: string // dateStart
  de: string // dateEnd
  s: string // source
}

export interface LlmNewOrganization {
  n: string // name
  i: LlmIdentity[] // identities
  conn: {
    t: string // title
    ds: string // dateStart
    de: string // dateEnd
    s: string // source
  }
}

export interface LlmAttributeValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [source: string]: any
}

export interface LlmMemberEnrichmentResult {
  confidence: number
  changes: {
    displayName: string
    identities: {
      update: LlmIdentity[]
      new: LlmIdentity[]
    }
    attributes: {
      update: {
        [attributeName: string]: LlmAttributeValue
      }
      new: {
        [attributeName: string]: LlmAttributeValue
      }
    }
    organizations: {
      newConns: LlmOrganizationConnection[]
      newOrgs: LlmNewOrganization[]
    }
  }
}
