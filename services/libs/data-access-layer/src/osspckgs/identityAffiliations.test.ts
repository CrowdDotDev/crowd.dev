import { describe, expect, it, vi } from 'vitest'

import { QueryExecutor } from '../queryExecutor'
import {
  StagingAffiliationRow,
  fillIdentityAffiliationsStaging,
  mergeIdentityAffiliationsStaging,
  readIdentityAffiliationsStagingPage,
  truncateIdentityAffiliationsStaging,
  writeIdentityAffiliationsStagingResults,
} from './identityAffiliations'

interface RecordedCall {
  method: string
  query: string
  params?: object
  inTx: boolean
}

interface FakeOptions {
  selectRows?: object[]
  selectOneRow?: object
  resultCounts?: number[]
}

function fakeQx(options: FakeOptions = {}) {
  const calls: RecordedCall[] = []
  const resultCounts = [...(options.resultCounts ?? [])]

  function build(inTx: boolean): QueryExecutor {
    const record = (method: string, query: string, params?: object) =>
      calls.push({ method, query, params, inTx })
    const executor = {
      select: vi.fn(async (query: string, params?: object) => {
        record('select', query, params)
        return options.selectRows ?? []
      }),
      selectNone: vi.fn(async (query: string, params?: object) => {
        record('selectNone', query, params)
      }),
      selectOne: vi.fn(async (query: string, params?: object) => {
        record('selectOne', query, params)
        return options.selectOneRow ?? { count: 0 }
      }),
      selectOneOrNone: vi.fn(),
      result: vi.fn(async (query: string, params?: object) => {
        record('result', query, params)
        return resultCounts.shift() ?? 0
      }),
      tx: vi.fn(async <T>(fn: (tx: QueryExecutor) => Promise<T>) => fn(build(true))),
    }
    return executor as unknown as QueryExecutor
  }

  return { qx: build(false), calls }
}

const RUN_STARTED_AT = new Date('2026-10-13T06:00:00.000Z')

describe('truncateIdentityAffiliationsStaging', () => {
  it('truncates the staging table', async () => {
    const { qx, calls } = fakeQx()

    await truncateIdentityAffiliationsStaging(qx)

    expect(calls).toHaveLength(1)
    expect(calls[0].query).toContain('TRUNCATE identity_affiliations_staging')
  })
})

describe('fillIdentityAffiliationsStaging', () => {
  it('fills staging from repo_contributors and maintainers in one statement', async () => {
    const { qx, calls } = fakeQx({ resultCounts: [42] })

    const count = await fillIdentityAffiliationsStaging(qx)

    expect(count).toBe(42)
    expect(calls).toHaveLength(1)
    const { method, query } = calls[0]
    expect(method).toBe('result')
    expect(query).toContain('INSERT INTO identity_affiliations_staging')
    expect(query).toContain('FROM repo_contributors')
    expect(query).toContain('FROM maintainers')
    expect(query).toContain('lower(trim(github_login))')
    expect(query).toContain('lower(trim(email))')
    expect(query).toContain("identity_type IN ('github-login', 'email')")
    expect(query).toContain('ON CONFLICT DO NOTHING')
  })
})

describe('readIdentityAffiliationsStagingPage', () => {
  it('reads the first page without a key predicate', async () => {
    const { qx, calls } = fakeQx({
      selectRows: [{ identityType: 'email', identityValue: 'a@example.com' }],
    })

    const page = await readIdentityAffiliationsStagingPage(qx, null, 5000)

    expect(page).toEqual([{ identityType: 'email', identityValue: 'a@example.com' }])
    expect(calls).toHaveLength(1)
    expect(calls[0].query).not.toContain('>')
    expect(calls[0].query).toContain('ORDER BY identity_type, identity_value')
    expect(calls[0].query).toContain('LIMIT $(limit)')
    expect(calls[0].params).toEqual({ limit: 5000 })
  })

  it('reads strictly after the given key', async () => {
    const { qx, calls } = fakeQx()

    await readIdentityAffiliationsStagingPage(
      qx,
      { identityType: 'email', identityValue: 'z@example.com' },
      5000,
    )

    expect(calls[0].query).toContain(
      '(identity_type, identity_value) > ($(identityType), $(identityValue))',
    )
    expect(calls[0].query).toContain('ORDER BY identity_type, identity_value')
    expect(calls[0].params).toEqual({
      identityType: 'email',
      identityValue: 'z@example.com',
      limit: 5000,
    })
  })
})

describe('writeIdentityAffiliationsStagingResults', () => {
  const matched: StagingAffiliationRow = {
    identityType: 'github-login',
    identityValue: 'octocat',
    akritesMember: 'Acme',
    cdpOrganizationId: '11111111-1111-1111-1111-111111111111',
    confidence: 'cdp',
    confidenceScore: 1,
    cdpMemberId: '22222222-2222-2222-2222-222222222222',
    matchedDomain: null,
    matchedAlias: null,
  }
  const unmatched: StagingAffiliationRow = {
    identityType: 'email',
    identityValue: 'nobody@example.com',
    akritesMember: null,
    cdpOrganizationId: null,
    confidence: null,
    confidenceScore: null,
    cdpMemberId: null,
    matchedDomain: null,
    matchedAlias: null,
  }

  it('updates staging rows from a VALUES list in one statement', async () => {
    const { qx, calls } = fakeQx({ resultCounts: [2] })

    const count = await writeIdentityAffiliationsStagingResults(
      qx,
      [matched, unmatched],
      RUN_STARTED_AT,
    )

    expect(count).toBe(2)
    expect(calls).toHaveLength(1)
    const { method, query, params } = calls[0]
    expect(method).toBe('result')
    expect(query).toContain('UPDATE identity_affiliations_staging AS s')
    expect(query).toContain('FROM (VALUES $(rows:raw))')
    expect(query).toContain('resolved_at = $(resolvedAt)')
    expect(params).toMatchObject({ resolvedAt: RUN_STARTED_AT })
    const rows = (params as { rows: string }).rows
    expect(rows).toContain("'octocat'")
    expect(rows).toContain("'11111111-1111-1111-1111-111111111111'::uuid")
    expect(rows).toContain('1::numeric')
    expect(rows).toContain("'nobody@example.com'")
    expect(rows).toContain('null::uuid')
    expect(rows).toContain('null::numeric')
  })

  it('issues nothing for an empty page', async () => {
    const { qx, calls } = fakeQx()

    const count = await writeIdentityAffiliationsStagingResults(qx, [], RUN_STARTED_AT)

    expect(count).toBe(0)
    expect(calls).toHaveLength(0)
  })
})

describe('mergeIdentityAffiliationsStaging', () => {
  it('merges inside a transaction in guard, delete, change, touch, insert, count order', async () => {
    const { qx, calls } = fakeQx({
      selectOneRow: { total: 10, unresolved: 0, matched: 4 },
      resultCounts: [1, 2, 3, 5],
      selectRows: [
        { method: 'cdp', n: 2 },
        { method: 'github_company', n: 2 },
        { method: 'unresolved', n: 6 },
      ],
    })

    const counts = await mergeIdentityAffiliationsStaging(qx, RUN_STARTED_AT)

    expect(qx.tx).toHaveBeenCalledTimes(1)
    expect(calls.every((call) => call.inTx)).toBe(true)
    expect(calls.map((call) => call.method)).toEqual([
      'selectOne',
      'result',
      'result',
      'result',
      'result',
      'select',
    ])
    expect(calls[0].query).toContain('AS unresolved')
    expect(calls[0].query).toContain('AS matched')
    expect(calls[1].query).toContain('DELETE FROM identity_affiliations')
    expect(calls[2].query).toContain('UPDATE identity_affiliations')
    expect(calls[2].query).toContain('IS DISTINCT FROM')
    expect(calls[3].query).toContain('UPDATE identity_affiliations')
    expect(calls[3].query).toContain('IS NOT DISTINCT FROM')
    expect(calls[3].query).toContain('a.resolved_at <> $(runStartedAt)')
    expect(calls[4].query).toContain('INSERT INTO identity_affiliations')
    expect(calls[5].query).toContain('GROUP BY')
    expect(calls.every((call) => !call.params || 'runStartedAt' in call.params)).toBe(true)
    expect(counts).toEqual({
      removed: 1,
      changed: 2,
      unchanged: 3,
      inserted: 5,
      byMethod: { cdp: 2, email_domain: 0, github_company: 2, unresolved: 6 },
    })
  })

  it.each([
    { total: 0, unresolved: 0, matched: 0 },
    { total: 10, unresolved: 1, matched: 4 },
    { total: 10, unresolved: 0, matched: 0 },
  ])('refuses to merge before any write when the guard fails (%o)', async (guard) => {
    const { qx, calls } = fakeQx({ selectOneRow: guard })

    await expect(mergeIdentityAffiliationsStaging(qx, RUN_STARTED_AT)).rejects.toThrow(
      `Refusing to merge identity affiliations: total ${guard.total}, unresolved ${guard.unresolved}, matched ${guard.matched}`,
    )
    expect(calls.map((call) => call.method)).toEqual(['selectOne'])
  })
})
