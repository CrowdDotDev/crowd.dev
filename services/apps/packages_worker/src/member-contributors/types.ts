export type ContributorIdentityType = 'github-login' | 'email'

export interface ContributorIdentity {
  type: ContributorIdentityType
  value: string
}

export type AffiliationConfidence = 'cdp' | 'email_domain' | 'github_company'

export interface ResolvedCdpAffiliation {
  memberId: string
  displayName: string | null
  akritesMember: string
  cdpOrganizationId: string
  confidence: 'cdp'
  confidenceScore: 1
}

export interface ResolvedEmailDomainAffiliation {
  akritesMember: string
  cdpOrganizationId: string
  matchedDomain: string
  confidence: 'email_domain'
  confidenceScore: 0.7
}

export interface ResolvedGithubCompanyAffiliation {
  akritesMember: string
  cdpOrganizationId: string
  matchedAlias: string
  confidence: 'github_company'
  confidenceScore: 0.3
}

export function contributorIdentityKey(identity: ContributorIdentity): string {
  return `${identity.type}:${identity.value.toLowerCase()}`
}
