export interface MemberUpdateInput {
  member: {
    id: string
  }
  memberOrganizationIds?: string[]
  syncToOpensearch?: boolean
}

export interface IRecalculateAffiliationsForNewRolesInput {
  offset?: number
}

export interface IProcessMemberBotSuggestionWithLLMInput {
  memberId: string
}

export interface MemberBotSuggestionResult {
  isBot: boolean
  confidence: number
}
