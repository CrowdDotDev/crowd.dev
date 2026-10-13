import { describe, expect, it } from 'vitest'

import {
  ResolvedCdpAffiliation,
  ResolvedEmailDomainAffiliation,
  ResolvedGithubCompanyAffiliation,
} from '../../types'
import { pickBestAffiliation } from '../pickBestAffiliation'

const cdp: ResolvedCdpAffiliation = {
  memberId: 'member-1',
  displayName: 'Jane',
  akritesMember: 'Cisco',
  cdpOrganizationId: 'cisco-1',
  confidence: 'cdp',
  confidenceScore: 1,
}

const emailDomain: ResolvedEmailDomainAffiliation = {
  akritesMember: 'Google',
  cdpOrganizationId: 'google-1',
  matchedDomain: 'google.com',
  confidence: 'email_domain',
  confidenceScore: 0.7,
}

const githubCompany: ResolvedGithubCompanyAffiliation = {
  akritesMember: 'Intel',
  cdpOrganizationId: 'intel-1',
  matchedAlias: 'intel',
  confidence: 'github_company',
  confidenceScore: 0.3,
}

const cdpResult = {
  akritesMember: 'Cisco',
  cdpOrganizationId: 'cisco-1',
  confidence: 'cdp',
  confidenceScore: 1,
  cdpMemberId: 'member-1',
  matchedDomain: null,
  matchedAlias: null,
}

describe('pickBestAffiliation', () => {
  it('maps a cdp hit with the member id', () => {
    expect(pickBestAffiliation(cdp, undefined, undefined)).toEqual(cdpResult)
  })

  it('maps an email_domain hit with the matched domain when cdp is absent', () => {
    expect(pickBestAffiliation(undefined, emailDomain, githubCompany)).toEqual({
      akritesMember: 'Google',
      cdpOrganizationId: 'google-1',
      confidence: 'email_domain',
      confidenceScore: 0.7,
      cdpMemberId: null,
      matchedDomain: 'google.com',
      matchedAlias: null,
    })
  })

  it('maps a github_company hit with the matched alias when nothing stronger exists', () => {
    expect(pickBestAffiliation(undefined, undefined, githubCompany)).toEqual({
      akritesMember: 'Intel',
      cdpOrganizationId: 'intel-1',
      confidence: 'github_company',
      confidenceScore: 0.3,
      cdpMemberId: null,
      matchedDomain: null,
      matchedAlias: 'intel',
    })
  })

  it('prefers cdp when all three methods hit', () => {
    expect(pickBestAffiliation(cdp, emailDomain, githubCompany)).toEqual(cdpResult)
  })

  it('returns an all-null result when nothing hits', () => {
    expect(pickBestAffiliation(undefined, undefined, undefined)).toEqual({
      akritesMember: null,
      cdpOrganizationId: null,
      confidence: null,
      confidenceScore: null,
      cdpMemberId: null,
      matchedDomain: null,
      matchedAlias: null,
    })
  })
})
