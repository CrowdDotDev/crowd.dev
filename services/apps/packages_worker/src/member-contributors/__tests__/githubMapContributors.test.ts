import { describe, expect, it } from 'vitest'

import { toGithubContributorRows } from '../github/mapContributors'

const observedAt = new Date('2026-10-18T07:00:00Z')

describe('toGithubContributorRows', () => {
  it('maps a user to a lowercase github-login commit-author row observed now', () => {
    const rows = toGithubContributorRows(
      [{ login: 'DougWilson', type: 'User', contributions: 12 }],
      '42',
      observedAt,
    )
    expect(rows).toEqual([
      {
        repoId: '42',
        source: 'github',
        role: 'commit-author',
        roleKind: 'contributor',
        identityType: 'github-login',
        identityValue: 'dougwilson',
        firstSeenAt: observedAt,
        lastSeenAt: observedAt,
        endedAt: null,
      },
    ])
  })

  it('drops bots by type and by login', () => {
    const rows = toGithubContributorRows(
      [
        { login: 'dependabot[bot]', type: 'Bot' },
        { login: 'renovate-bot', type: 'User' },
        { login: 'jane', type: 'User' },
      ],
      '42',
      observedAt,
    )
    expect(rows.map((r) => r.identityValue)).toEqual(['jane'])
  })

  it('drops entries without a string login', () => {
    const rows = toGithubContributorRows([{ type: 'User' }, { login: 7 }], '42', observedAt)
    expect(rows).toEqual([])
  })

  it('collapses logins that differ only by case', () => {
    const rows = toGithubContributorRows(
      [
        { login: 'Jane', type: 'User' },
        { login: 'jane', type: 'User' },
      ],
      '42',
      observedAt,
    )
    expect(rows).toHaveLength(1)
  })
})
