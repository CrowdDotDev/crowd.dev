import type { IdentityAffiliationResult } from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'

import {
  ResolvedCdpAffiliation,
  ResolvedEmailDomainAffiliation,
  ResolvedGithubCompanyAffiliation,
} from '../types'

export type ResolvedAffiliation =
  | ResolvedCdpAffiliation
  | ResolvedEmailDomainAffiliation
  | ResolvedGithubCompanyAffiliation

const UNRESOLVED_AFFILIATION: IdentityAffiliationResult = {
  akritesMember: null,
  cdpOrganizationId: null,
  confidence: null,
  confidenceScore: null,
  cdpMemberId: null,
  matchedDomain: null,
  matchedAlias: null,
}

function toAffiliationResult(affiliation: ResolvedAffiliation): IdentityAffiliationResult {
  return {
    akritesMember: affiliation.akritesMember,
    cdpOrganizationId: affiliation.cdpOrganizationId,
    confidence: affiliation.confidence,
    confidenceScore: affiliation.confidenceScore,
    cdpMemberId: 'memberId' in affiliation ? affiliation.memberId : null,
    matchedDomain: 'matchedDomain' in affiliation ? affiliation.matchedDomain : null,
    matchedAlias: 'matchedAlias' in affiliation ? affiliation.matchedAlias : null,
  }
}

export function pickBestAffiliation(
  cdp: ResolvedCdpAffiliation | undefined,
  emailDomain: ResolvedEmailDomainAffiliation | undefined,
  githubCompany: ResolvedGithubCompanyAffiliation | undefined,
): IdentityAffiliationResult {
  const best = cdp ?? emailDomain ?? githubCompany
  return best ? toAffiliationResult(best) : { ...UNRESOLVED_AFFILIATION }
}
