import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as memberIdentities from '@crowd/data-access-layer/src/members/identities'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { AkritesMember } from '../registry'
import {
  matchGithubCompany,
  resolveGithubCompanyAffiliations,
  resolveGithubCompanyAffiliationsByHandles,
} from '../resolveGithubCompanyAffiliations'

vi.mock('@crowd/data-access-layer/src/members/identities', () => ({
  findGithubProfileCompaniesByHandles: vi.fn(),
}))

const findCompanies = vi.mocked(memberIdentities.findGithubProfileCompaniesByHandles)

const qx = {} as QueryExecutor

const registry: AkritesMember[] = [
  {
    name: 'Cisco',
    cdpOrganizationIds: ['cisco-1', 'cisco-2'],
    aliases: ['cisco', 'cisco systems'],
  },
  { name: 'Google', cdpOrganizationIds: ['google-1'], aliases: ['google'] },
  { name: 'IBM', cdpOrganizationIds: ['ibm-1'], aliases: ['ibm'] },
  { name: 'Microsoft', cdpOrganizationIds: ['microsoft-1'], aliases: ['microsoft', 'msft'] },
  { name: 'Red Hat', cdpOrganizationIds: ['redhat-1', 'redhat-2'], aliases: ['red hat', 'redhat'] },
]

function memberOf(company: string, members: AkritesMember[] = registry): string | undefined {
  return matchGithubCompany(company, members)?.akritesMember
}

beforeEach(() => {
  vi.clearAllMocks()
  findCompanies.mockResolvedValue([])
})

describe('matchGithubCompany', () => {
  it('resolves a plain member name', () => {
    expect(matchGithubCompany('Google', registry)).toEqual({
      akritesMember: 'Google',
      cdpOrganizationId: 'google-1',
      matchedAlias: 'google',
      confidence: 'github_company',
      confidenceScore: 0.3,
    })
  })

  it('resolves an @-prefixed organization handle', () => {
    expect(memberOf('@microsoft')).toBe('Microsoft')
  })

  it('resolves names carrying a legal suffix', () => {
    expect(memberOf('Google LLC')).toBe('Google')
    expect(memberOf('Cisco Systems, Inc.')).toBe('Cisco')
    expect(memberOf('Red Hat, Inc.')).toBe('Red Hat')
  })

  it('resolves an abbreviation alias', () => {
    expect(matchGithubCompany('MSFT', registry)).toMatchObject({
      akritesMember: 'Microsoft',
      matchedAlias: 'msft',
    })
  })

  it('resolves a member name embedded in a longer string', () => {
    expect(memberOf('Software Engineer at Google')).toBe('Google')
  })

  it('omits a non-member company', () => {
    expect(matchGithubCompany('Acme Corp', registry)).toBeUndefined()
  })

  it('omits strings that only contain an alias as a substring of a word', () => {
    expect(matchGithubCompany('Googleplex', registry)).toBeUndefined()
    expect(matchGithubCompany('Microsoftware', registry)).toBeUndefined()
    expect(matchGithubCompany('Redhatter', registry)).toBeUndefined()
  })

  it('omits empty and whitespace-only strings', () => {
    expect(matchGithubCompany('', registry)).toBeUndefined()
    expect(matchGithubCompany('   ', registry)).toBeUndefined()
  })

  it('omits strings that mark the employer as former', () => {
    expect(matchGithubCompany('ex-Microsoft', registry)).toBeUndefined()
    expect(matchGithubCompany('previously Google', registry)).toBeUndefined()
    expect(matchGithubCompany('former Cisco', registry)).toBeUndefined()
  })

  it('omits strings naming two different members', () => {
    expect(matchGithubCompany('Google, Microsoft', registry)).toBeUndefined()
  })

  it('resolves a string naming the same member twice with the first registry alias', () => {
    expect(matchGithubCompany('Red Hat / redhat', registry)).toMatchObject({
      akritesMember: 'Red Hat',
      cdpOrganizationId: 'redhat-1',
      matchedAlias: 'red hat',
    })
  })

  it('resolves an alias added only in the registry', () => {
    const custom = [
      ...registry,
      { name: 'Blue', cdpOrganizationIds: ['blue-1'], aliases: ['big blue'] },
    ]
    expect(matchGithubCompany('Big Blue Labs', custom)).toMatchObject({
      akritesMember: 'Blue',
      matchedAlias: 'big blue',
    })
  })

  it('resolves names wrapped in CJK brackets and punctuation', () => {
    expect(memberOf('IBM（大連）')).toBe('IBM')
  })
})

describe('resolveGithubCompanyAffiliations', () => {
  it('keys results by trimmed input and skips empty or unmatched strings', () => {
    const out = resolveGithubCompanyAffiliations(
      ['  Google LLC ', '', '   ', 'Acme', '@microsoft'],
      registry,
    )
    expect([...out.keys()]).toEqual(['Google LLC', '@microsoft'])
    expect(out.get('Google LLC')?.akritesMember).toBe('Google')
    expect(out.get('@microsoft')?.akritesMember).toBe('Microsoft')
  })
})

describe('resolveGithubCompanyAffiliationsByHandles', () => {
  it('returns empty and issues no query for empty input', async () => {
    const out = await resolveGithubCompanyAffiliationsByHandles(qx, [], registry)
    expect(out.size).toBe(0)
    expect(findCompanies).not.toHaveBeenCalled()
  })

  it('queries once with lowercased, trimmed, deduped handles', async () => {
    await resolveGithubCompanyAffiliationsByHandles(qx, ['Alice', ' alice ', 'BOB'], registry)
    expect(findCompanies).toHaveBeenCalledTimes(1)
    expect(findCompanies).toHaveBeenCalledWith(qx, ['alice', 'bob'])
  })

  it('omits a handle with no company row', async () => {
    findCompanies.mockResolvedValue([{ githubHandle: 'alice', company: 'Google' }])
    const out = await resolveGithubCompanyAffiliationsByHandles(qx, ['alice', 'bob'], registry)
    expect(out.has('github-login:bob')).toBe(false)
  })

  it('resolves a handle whose company matches a member', async () => {
    findCompanies.mockResolvedValue([{ githubHandle: 'alice', company: '@google' }])
    const out = await resolveGithubCompanyAffiliationsByHandles(qx, ['Alice'], registry)
    expect(out.get('github-login:alice')).toEqual({
      akritesMember: 'Google',
      cdpOrganizationId: 'google-1',
      matchedAlias: 'google',
      confidence: 'github_company',
      confidenceScore: 0.3,
    })
  })

  it('resolves a handle whose several company rows agree on one member', async () => {
    findCompanies.mockResolvedValue([
      { githubHandle: 'alice', company: 'redhat' },
      { githubHandle: 'alice', company: 'Red Hat' },
      { githubHandle: 'alice', company: 'Acme' },
    ])
    const out = await resolveGithubCompanyAffiliationsByHandles(qx, ['alice'], registry)
    expect(out.get('github-login:alice')).toMatchObject({
      akritesMember: 'Red Hat',
      matchedAlias: 'red hat',
    })
  })

  it('omits a handle whose company rows disagree on the member', async () => {
    findCompanies.mockResolvedValue([
      { githubHandle: 'alice', company: 'Google' },
      { githubHandle: 'alice', company: 'Microsoft' },
    ])
    const out = await resolveGithubCompanyAffiliationsByHandles(qx, ['alice'], registry)
    expect(out.has('github-login:alice')).toBe(false)
  })
})
