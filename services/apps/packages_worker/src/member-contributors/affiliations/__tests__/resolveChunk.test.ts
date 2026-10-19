import * as activity from '@temporalio/activity'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as identityAffiliations from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'
import type { IdentityKey } from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { resolveCdpAffiliations } from '../../resolveCdpAffiliations'
import { resolveEmailDomainAffiliations } from '../../resolveEmailDomainAffiliations'
import { resolveGithubCompanyAffiliationsByHandles } from '../../resolveGithubCompanyAffiliations'
import {
  ResolvedCdpAffiliation,
  ResolvedEmailDomainAffiliation,
  ResolvedGithubCompanyAffiliation,
} from '../../types'
import { resolveIdentityAffiliationsChunk } from '../resolveChunk'

const qx = vi.hoisted(() => ({}))

vi.mock('@temporalio/activity', () => ({ heartbeat: vi.fn() }))
vi.mock('../../../db', () => ({
  getCdpDb: vi.fn().mockResolvedValue(qx),
  getPackagesDb: vi.fn().mockResolvedValue(qx),
}))
vi.mock('@crowd/data-access-layer/src/osspckgs/identityAffiliations', () => ({
  readIdentityAffiliationsStagingPage: vi.fn(),
  writeIdentityAffiliationsStagingResults: vi.fn(),
}))
vi.mock('../../resolveCdpAffiliations', () => ({ resolveCdpAffiliations: vi.fn() }))
vi.mock('../../resolveEmailDomainAffiliations', () => ({
  resolveEmailDomainAffiliations: vi.fn(),
}))
vi.mock('../../resolveGithubCompanyAffiliations', () => ({
  resolveGithubCompanyAffiliationsByHandles: vi.fn(),
}))

const readPage = vi.mocked(identityAffiliations.readIdentityAffiliationsStagingPage)
const writeResults = vi.mocked(identityAffiliations.writeIdentityAffiliationsStagingResults)
const resolveCdp = vi.mocked(resolveCdpAffiliations)
const resolveEmailDomain = vi.mocked(resolveEmailDomainAffiliations)
const resolveGithubCompany = vi.mocked(resolveGithubCompanyAffiliationsByHandles)
const heartbeat = vi.mocked(activity.heartbeat)

const runStartedAt = '2026-10-13T06:00:00.000Z'

const unresolved = {
  akritesMember: null,
  cdpOrganizationId: null,
  confidence: null,
  confidenceScore: null,
  cdpMemberId: null,
  matchedDomain: null,
  matchedAlias: null,
}

const cdpHit: ResolvedCdpAffiliation = {
  memberId: 'member-1',
  displayName: 'Octo Cat',
  akritesMember: 'Cisco',
  cdpOrganizationId: 'cisco-1',
  confidence: 'cdp',
  confidenceScore: 1,
}

const emailDomainHit: ResolvedEmailDomainAffiliation = {
  akritesMember: 'Cisco',
  cdpOrganizationId: 'cisco-1',
  matchedDomain: 'cisco.com',
  confidence: 'email_domain',
  confidenceScore: 0.7,
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

const emailDomainResult = {
  akritesMember: 'Cisco',
  cdpOrganizationId: 'cisco-1',
  confidence: 'email_domain',
  confidenceScore: 0.7,
  cdpMemberId: null,
  matchedDomain: 'cisco.com',
  matchedAlias: null,
}

const page: IdentityKey[] = [
  { identityType: 'github-login', identityValue: 'octocat' },
  { identityType: 'email', identityValue: 'jane@cisco.com' },
  { identityType: 'email', identityValue: '1+bob@users.noreply.github.com' },
  { identityType: 'github-login', identityValue: 'nobody' },
]

function cdpMap(entries: Array<[string, ResolvedCdpAffiliation]>) {
  return new Map(entries)
}

function emailDomainMap(entries: Array<[string, ResolvedEmailDomainAffiliation]>) {
  return new Map(entries)
}

function githubCompanyMap() {
  return new Map<string, ResolvedGithubCompanyAffiliation>()
}

beforeEach(() => {
  vi.clearAllMocks()
  writeResults.mockImplementation(async (_qx, rows) => rows.length)
  resolveGithubCompany.mockResolvedValue(githubCompanyMap())
})

describe('resolveIdentityAffiliationsChunk', () => {
  it('resolves one page with fixed precedence and writes every row', async () => {
    readPage.mockResolvedValue(page)
    resolveCdp.mockResolvedValue(cdpMap([['github-login:octocat', cdpHit]]))
    resolveEmailDomain.mockResolvedValue(emailDomainMap([['email:jane@cisco.com', emailDomainHit]]))

    const afterKey: IdentityKey = { identityType: 'email', identityValue: 'a@b.c' }
    const result = await resolveIdentityAffiliationsChunk({ runStartedAt, afterKey, limit: 5000 })

    expect(readPage).toHaveBeenCalledWith(qx as QueryExecutor, afterKey, 5000)
    expect(resolveCdp).toHaveBeenCalledTimes(1)
    expect(resolveCdp).toHaveBeenCalledWith(qx, [
      { type: 'github-login', value: 'octocat' },
      { type: 'email', value: 'jane@cisco.com' },
      { type: 'email', value: '1+bob@users.noreply.github.com' },
      { type: 'github-login', value: 'nobody' },
    ])
    expect(resolveEmailDomain).toHaveBeenCalledTimes(1)
    expect(resolveEmailDomain).toHaveBeenCalledWith(qx, [
      'jane@cisco.com',
      '1+bob@users.noreply.github.com',
    ])
    expect(resolveGithubCompany).toHaveBeenCalledTimes(1)
    expect(resolveGithubCompany).toHaveBeenCalledWith(qx, ['octocat', 'nobody'])

    expect(writeResults).toHaveBeenCalledTimes(1)
    expect(writeResults).toHaveBeenCalledWith(
      qx,
      [
        { identityType: 'github-login', identityValue: 'octocat', ...cdpResult },
        { identityType: 'email', identityValue: 'jane@cisco.com', ...emailDomainResult },
        {
          identityType: 'email',
          identityValue: '1+bob@users.noreply.github.com',
          ...unresolved,
        },
        { identityType: 'github-login', identityValue: 'nobody', ...unresolved },
      ],
      new Date(runStartedAt),
    )

    expect(result).toEqual({
      lastKey: { identityType: 'github-login', identityValue: 'nobody' },
      read: 4,
      counts: { cdp: 1, email_domain: 1, github_company: 0, unresolved: 2 },
    })
    expect(heartbeat).toHaveBeenCalledTimes(1)
  })

  it('returns zeros and touches nothing for an empty page', async () => {
    readPage.mockResolvedValue([])

    const result = await resolveIdentityAffiliationsChunk({
      runStartedAt,
      afterKey: null,
      limit: 5000,
    })

    expect(result).toEqual({
      lastKey: null,
      read: 0,
      counts: { cdp: 0, email_domain: 0, github_company: 0, unresolved: 0 },
    })
    expect(resolveCdp).not.toHaveBeenCalled()
    expect(resolveEmailDomain).not.toHaveBeenCalled()
    expect(resolveGithubCompany).not.toHaveBeenCalled()
    expect(writeResults).not.toHaveBeenCalled()
  })

  it('downgrades to email_domain when cdp drops the member on the next run', async () => {
    const janePage: IdentityKey[] = [{ identityType: 'email', identityValue: 'jane@cisco.com' }]
    readPage.mockResolvedValue(janePage)
    resolveEmailDomain.mockResolvedValue(emailDomainMap([['email:jane@cisco.com', emailDomainHit]]))
    resolveCdp
      .mockResolvedValueOnce(cdpMap([['email:jane@cisco.com', cdpHit]]))
      .mockResolvedValueOnce(cdpMap([]))

    await resolveIdentityAffiliationsChunk({ runStartedAt, afterKey: null, limit: 5000 })
    await resolveIdentityAffiliationsChunk({ runStartedAt, afterKey: null, limit: 5000 })

    expect(writeResults).toHaveBeenNthCalledWith(
      1,
      qx,
      [{ identityType: 'email', identityValue: 'jane@cisco.com', ...cdpResult }],
      new Date(runStartedAt),
    )
    expect(writeResults).toHaveBeenNthCalledWith(
      2,
      qx,
      [{ identityType: 'email', identityValue: 'jane@cisco.com', ...emailDomainResult }],
      new Date(runStartedAt),
    )
    expect(resolveGithubCompany).not.toHaveBeenCalled()
  })
})
