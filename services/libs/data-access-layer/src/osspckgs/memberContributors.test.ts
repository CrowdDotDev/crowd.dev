import { describe, expect, it, vi } from 'vitest'

import { QueryExecutor } from '../queryExecutor'
import {
  AffiliatedMemberIdentityRow,
  MemberContributorsPackageRow,
  findAffiliatedMemberIdentities,
  findMemberContributorsPackage,
} from './memberContributors'

interface RecordedCall {
  method: string
  query: string
  params?: object
}

interface FakeOptions {
  selectRows?: object[]
  selectOneOrNoneRow?: object | null
}

function fakeQx(options: FakeOptions = {}) {
  const calls: RecordedCall[] = []
  const record = (method: string, query: string, params?: object) =>
    calls.push({ method, query, params })
  const executor = {
    select: vi.fn(async (query: string, params?: object) => {
      record('select', query, params)
      return options.selectRows ?? []
    }),
    selectOneOrNone: vi.fn(async (query: string, params?: object) => {
      record('selectOneOrNone', query, params)
      return options.selectOneOrNoneRow ?? null
    }),
    selectOne: vi.fn(),
    selectNone: vi.fn(),
    result: vi.fn(),
    tx: vi.fn(),
  }
  return { qx: executor as unknown as QueryExecutor, calls }
}

const PURL = 'pkg:npm/express'

const PACKAGE_ROW: MemberContributorsPackageRow = {
  packageId: '11111111-1111-1111-1111-111111111111',
  purl: PURL,
  name: 'express',
  ecosystem: 'npm',
  repoId: '22222222-2222-2222-2222-222222222222',
  repoUrl: 'https://github.com/expressjs/express',
  repoMappingConfidence: '0.95',
  hasContributorRows: true,
}

const IDENTITY_ROW: AffiliatedMemberIdentityRow = {
  person: '33333333-3333-3333-3333-333333333333',
  source: 'git_activity',
  role: null,
  roleKind: 'contributor',
  identityType: 'github-login',
  identityValue: 'octocat',
  endedAt: null,
  lastSeenAt: new Date('2026-10-01T00:00:00.000Z'),
  registryUsername: null,
  registryDisplayName: null,
  akritesMember: 'Acme',
  cdpOrganizationId: '44444444-4444-4444-4444-444444444444',
  confidence: 'cdp',
  confidenceScore: '1.0',
}

describe('findMemberContributorsPackage', () => {
  it('looks up the package with its best repo link and collected flag in one query', async () => {
    const { qx, calls } = fakeQx({ selectOneOrNoneRow: PACKAGE_ROW })

    const row = await findMemberContributorsPackage(qx, PURL)

    expect(row).toEqual(PACKAGE_ROW)
    expect(calls).toHaveLength(1)
    const { method, query, params } = calls[0]
    expect(method).toBe('selectOneOrNone')
    expect(query).toContain('FROM packages p')
    expect(query).toContain('package_repos pr2')
    expect(query).toContain(
      'EXISTS (SELECT 1 FROM repo_contributors rc WHERE rc.repo_id = pr.repo_id)',
    )
    expect(query).toContain('WHERE p.purl = $(purl)')
    expect(params).toEqual({ purl: PURL })
  })

  it('returns null for an unknown purl', async () => {
    const { qx, calls } = fakeQx({ selectOneOrNoneRow: null })

    const row = await findMemberContributorsPackage(qx, 'pkg:npm/unknown')

    expect(row).toBeNull()
    expect(calls).toHaveLength(1)
  })
})

describe('findAffiliatedMemberIdentities', () => {
  it('reads affiliated identity rows for the repo and package in one query', async () => {
    const { qx, calls } = fakeQx({ selectRows: [IDENTITY_ROW] })

    const rows = await findAffiliatedMemberIdentities(qx, {
      packageId: PACKAGE_ROW.packageId,
      repoId: PACKAGE_ROW.repoId,
    })

    expect(rows).toEqual([IDENTITY_ROW])
    expect(calls).toHaveLength(1)
    const { method, query, params } = calls[0]
    expect(method).toBe('select')
    expect(query).toContain('WHERE rc.repo_id = $(repoId)')
    expect(query).toContain('WHERE pm.package_id = $(packageId)')
    expect(query).toContain('JOIN identity_affiliations ia')
    expect(query).toContain('JOIN affiliated a ON a.person = i.person')
    expect(query).toContain(
      "LEFT JOIN login_member lm ON rc.identity_type = 'github-login' AND lm.login = rc.identity_value",
    )
    expect(query).toContain(
      "LEFT JOIN identity_affiliations il ON il.identity_type = 'github-login' AND il.identity_value = reg.login",
    )
    expect(query).not.toContain('(SELECT member FROM')
    expect(query).toContain('LEFT JOIN repo_login rl ON rl.login = lower(reg.username)')
    expect(query).toContain('COALESCE(rc.cdp_member_id, ia.cdp_member_id)::text AS cdp_member_id')
    expect(params).toEqual({ packageId: PACKAGE_ROW.packageId, repoId: PACKAGE_ROW.repoId })
  })

  it('still issues exactly one query when the package has no repo', async () => {
    const { qx, calls } = fakeQx()

    const rows = await findAffiliatedMemberIdentities(qx, {
      packageId: PACKAGE_ROW.packageId,
      repoId: null,
    })

    expect(rows).toEqual([])
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('select')
    expect(calls[0].params).toEqual({ packageId: PACKAGE_ROW.packageId, repoId: null })
  })
})
