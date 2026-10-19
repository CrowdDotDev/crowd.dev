import { describe, expect, it, vi } from 'vitest'

vi.mock('@crowd/data-access-layer', () => ({ findProjectCatalogBySourceUrl: vi.fn() }))

import { findProjectCatalogBySourceUrl } from '@crowd/data-access-layer'
import { IDbProjectCatalog } from '@crowd/data-access-layer/src/project-catalog/types'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import {
  findOrganizationSiblings,
  hasManyRepositories,
  organizationGroupKey,
  organizationNewProjectReviewReason,
  organizationOf,
  organizationReviewOf,
  organizationSiblings,
  organizationSubject,
} from './organizationGroup'

const source = 'https://lfx.slack.com/archives/C1/p1'
const rows = [
  { id: 'a', sourceUrl: source, requestHints: { organization: 'openbmc' } },
  { id: 'b', sourceUrl: source, requestHints: { organization: 'openbmc' } },
  { id: 'c', sourceUrl: source, requestHints: null },
  {
    id: 'd',
    sourceUrl: 'https://lfx.slack.com/archives/C1/p2',
    requestHints: { organization: 'openbmc' },
  },
  { id: 'e', sourceUrl: source, requestHints: { organization: 'other' } },
]

describe('organization groups', () => {
  it('groups the rows of one organization request by origin and owner', () => {
    expect(organizationOf(rows[0])).toBe('openbmc')
    expect(organizationOf(rows[2])).toBeNull()
    expect(organizationGroupKey(rows[0])).toBe(`${source}|openbmc`)
    expect(organizationGroupKey(rows[2])).toBeNull()
    expect(organizationSiblings(rows, rows[0]).map((row) => row.id)).toEqual(['b'])
    expect(organizationSiblings(rows, rows[2])).toEqual([])
  })

  it('explains why a new organization project waits for the CDP team', () => {
    expect(organizationNewProjectReviewReason('acme', 'Acme', 12)).toBe(
      "Acme isn't in LFX Insights yet; a new non-LF project with the 12 repositories of github.com/acme is created by the CDP team",
    )
    expect(organizationNewProjectReviewReason('acme', null, 1)).toContain(
      "github.com/acme isn't in LFX Insights yet; a new non-LF project with the 1 repository of",
    )
  })

  it('describes the organization under review from the lead and its siblings', () => {
    expect(organizationReviewOf(rows[0], 11)).toEqual({ owner: 'openbmc', repositories: 12 })
    expect(organizationReviewOf(rows[2], 3)).toBeNull()
  })

  it('names the organization with the right number of repositories', () => {
    expect(organizationSubject({ owner: 'a&b', repositories: 12 })).toBe(
      '*github.com/a&amp;b* (12 repositories)',
    )
    expect(organizationSubject({ owner: 'acme', repositories: 1 })).toBe(
      '*github.com/acme* (1 repository)',
    )
    expect(hasManyRepositories({ owner: 'acme', repositories: 1 })).toBe(false)
    expect(hasManyRepositories({ owner: 'acme', repositories: 2 })).toBe(true)
    expect(hasManyRepositories(null)).toBe(false)
  })

  it('loads the siblings of a lead from its thread and keeps the ones that match', async () => {
    const qx = {} as QueryExecutor
    const catalog = rows.map((row) => ({ ...row, action: 'review' })) as IDbProjectCatalog[]
    vi.mocked(findProjectCatalogBySourceUrl).mockResolvedValue(catalog)

    const siblings = await findOrganizationSiblings(qx, catalog[0], (row) => row.id !== 'b')
    expect(siblings).toEqual([])
    expect(await findOrganizationSiblings(qx, catalog[0], () => true)).toEqual([catalog[1]])
    expect(findProjectCatalogBySourceUrl).toHaveBeenCalledWith(qx, source)

    vi.mocked(findProjectCatalogBySourceUrl).mockClear()
    expect(await findOrganizationSiblings(qx, catalog[2], () => true)).toEqual([])
    expect(findProjectCatalogBySourceUrl).not.toHaveBeenCalled()
  })
})
