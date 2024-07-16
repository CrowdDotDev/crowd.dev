import { IMemberOpensearch, IOrganizationOpensearch } from '@crowd/types'

interface ITermFilter {
  term: {
    uuid_tenantId: string
  }
}

interface IExistsFilter {
  exists: {
    field: string
  }
}

interface IRangeFilterMemberId {
  range: {
    uuid_memberId: {
      gt: string
    }
  }
}

interface IRangeFilterOrganizationId {
  range: {
    uuid_organizationId: {
      gt: string
    }
  }
}

interface IRangeFilterCreatedAt {
  range: {
    date_createdAt: {
      gt: string
    }
  }
}

export type IMemberFilter = ITermFilter | IRangeFilterMemberId | IRangeFilterCreatedAt
export type IOrganizationFilter =
  | ITermFilter
  | IRangeFilterOrganizationId
  | IRangeFilterCreatedAt
  | IExistsFilter

export interface IMemberQueryBody {
  from: number
  size: number
  query: {
    bool: {
      filter: IMemberFilter[]
    }
  }
  sort: {
    [key: string]: string
  }
  collapse: {
    field: string
  }
  _source: string[]
}

export interface IOrganizationQueryBody {
  from: number
  size: number
  query: {
    bool: {
      filter: IOrganizationFilter[]
    }
  }
  sort: {
    [key: string]: string
  }
  collapse: {
    field: string
  }
  _source: string[]
}

export interface ILLMResult {
  body: ILLMBody
  prompt: string
  responseTimeSeconds: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelSpecificArgs: any
}

export interface ILLMBody {
  id: string
  type: string
  role: string
  model: string
  content: {
    type: string
    text: string
  }[]
  stop_reason: string
  stop_sequence: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export interface IProcessGenerateMemberMergeSuggestionsArgs {
  tenantId: string
  lastUuid?: string
}

export interface IProcessGenerateOrganizationMergeSuggestionsArgs {
  tenantId: string
  lastUuid?: string
  organizationIds?: string[]
}

export interface IProcessCheckSimilarityWithLLM {
  prompt: string
  modelId: string
  memberCouples?: string[][]
  organizationCouples?: string[][]
  region: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelSpecificArgs: any
}

export interface ISimilarityFilter {
  lte: number
  gte: number
}

export interface IProcessMergeOrganizationSuggestionsWithLLM {
  onlyLFXMembers?: boolean
  organizationIds?: string[]
  similarity: ISimilarityFilter
  tenantId: string
}

export interface IProcessMergeMemberSuggestionsWithLLM {
  similarity: ISimilarityFilter
  tenantId: string
}

export interface ISimilarMemberOpensearchResult {
  _source: IMemberOpensearch
}

export interface ISimilarOrganizationOpensearchResult {
  _source: IOrganizationOpensearch
}
