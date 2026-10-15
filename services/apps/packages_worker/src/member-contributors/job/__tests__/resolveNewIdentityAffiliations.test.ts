import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as identityAffiliations from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'

import { resolveIdentityPage } from '../../affiliations/resolveChunk'
import { resolveNewIdentityAffiliations } from '../resolveNewIdentityAffiliations'

const dbs = vi.hoisted(() => ({
  pkgs: { select: vi.fn().mockResolvedValue([{ nowMs: Date.UTC(2026, 9, 15, 10) }]) },
  cdp: {},
}))

vi.mock('../../../db', () => ({
  getPackagesDb: vi.fn().mockResolvedValue(dbs.pkgs),
  getCdpDb: vi.fn().mockResolvedValue(dbs.cdp),
}))
vi.mock('@crowd/data-access-layer/src/osspckgs/identityAffiliations', () => ({
  findIdentityKeysWithoutAffiliation: vi.fn(),
  insertIdentityAffiliations: vi.fn(),
}))
vi.mock('../../affiliations/resolveChunk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../affiliations/resolveChunk')>()),
  resolveIdentityPage: vi.fn(),
}))

const findMissing = vi.mocked(identityAffiliations.findIdentityKeysWithoutAffiliation)
const insert = vi.mocked(identityAffiliations.insertIdentityAffiliations)
const resolvePage = vi.mocked(resolveIdentityPage)

const unresolved = {
  akritesMember: null,
  cdpOrganizationId: null,
  confidence: null,
  confidenceScore: null,
  cdpMemberId: null,
  matchedDomain: null,
  matchedAlias: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveNewIdentityAffiliations', () => {
  it('does nothing for no logins', async () => {
    await expect(resolveNewIdentityAffiliations({ logins: [] })).resolves.toEqual({
      identities: 0,
      inserted: 0,
      counts: { cdp: 0, email_domain: 0, github_company: 0, unresolved: 0 },
    })
    expect(findMissing).not.toHaveBeenCalled()
  })

  it('skips logins that already have an affiliation row', async () => {
    findMissing.mockResolvedValue([])
    await expect(resolveNewIdentityAffiliations({ logins: ['octo'] })).resolves.toMatchObject({
      identities: 0,
      inserted: 0,
    })
    expect(findMissing).toHaveBeenCalledWith(dbs.pkgs, [
      { identityType: 'github-login', identityValue: 'octo' },
    ])
    expect(resolvePage).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })

  it('resolves and inserts only the missing logins with the run clock as resolved_at', async () => {
    const missing = [{ identityType: 'github-login' as const, identityValue: 'ada' }]
    findMissing.mockResolvedValue(missing)
    resolvePage.mockResolvedValue([
      {
        ...missing[0],
        ...unresolved,
        akritesMember: 'Cisco',
        cdpOrganizationId: 'c',
        confidence: 'github_company',
        confidenceScore: 0.3,
        matchedAlias: 'cisco',
      },
    ])
    insert.mockResolvedValue(1)

    const out = await resolveNewIdentityAffiliations({ logins: ['octo', 'ada'] })

    expect(resolvePage).toHaveBeenCalledWith(dbs.cdp, missing)
    expect(insert).toHaveBeenCalledWith(
      dbs.pkgs,
      expect.any(Array),
      new Date(Date.UTC(2026, 9, 15, 10)),
    )
    expect(out).toEqual({
      identities: 1,
      inserted: 1,
      counts: { cdp: 0, email_domain: 0, github_company: 1, unresolved: 0 },
    })
  })
})
