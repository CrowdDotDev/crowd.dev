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

export function contributorIdentityKey(identity: ContributorIdentity): string {
  return `${identity.type}:${identity.value.toLowerCase()}`
}
