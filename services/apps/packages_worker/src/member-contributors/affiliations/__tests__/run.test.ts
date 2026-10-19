import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as organizations from '@crowd/data-access-layer/src/organizations/base'
import { AKRITES_MEMBERS } from '@crowd/data-access-layer/src/osspckgs/akritesMembers'
import * as identityAffiliations from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'
import type { MergeCounts } from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'

import { readRunStart } from '../../governance/syncGovernanceContributors'
import { mergeIdentityAffiliations, prepareIdentityAffiliationsRun } from '../run'

const qx = vi.hoisted(() => ({}))
const cdpQx = vi.hoisted(() => ({}))
const log = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }))

vi.mock('@crowd/logging', () => ({ getServiceChildLogger: () => log }))
vi.mock('../../../db', () => ({
  getPackagesDb: vi.fn().mockResolvedValue(qx),
  getCdpDb: vi.fn().mockResolvedValue(cdpQx),
}))
vi.mock('@crowd/data-access-layer/src/organizations/base', () => ({
  findExistingOrganizationIds: vi.fn(),
}))
vi.mock('../../governance/syncGovernanceContributors', () => ({ readRunStart: vi.fn() }))
vi.mock('@crowd/data-access-layer/src/osspckgs/identityAffiliations', () => ({
  truncateIdentityAffiliationsStaging: vi.fn(),
  fillIdentityAffiliationsStaging: vi.fn(),
  mergeIdentityAffiliationsStaging: vi.fn(),
}))

const truncate = vi.mocked(identityAffiliations.truncateIdentityAffiliationsStaging)
const fill = vi.mocked(identityAffiliations.fillIdentityAffiliationsStaging)
const merge = vi.mocked(identityAffiliations.mergeIdentityAffiliationsStaging)
const runStart = vi.mocked(readRunStart)
const existingOrganizationIds = vi.mocked(organizations.findExistingOrganizationIds)
const registryOrganizationIds = AKRITES_MEMBERS.flatMap((member) => member.cdpOrganizationIds)

const runStartedAt = new Date('2026-10-13T06:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
  runStart.mockResolvedValue(runStartedAt)
  existingOrganizationIds.mockResolvedValue(registryOrganizationIds)
})

describe('prepareIdentityAffiliationsRun', () => {
  it('truncates then fills staging and returns the run start and identity count', async () => {
    fill.mockResolvedValue(42)

    const result = await prepareIdentityAffiliationsRun()

    expect(result).toEqual({ runStartedAt: runStartedAt.toISOString(), identities: 42 })
    expect(truncate).toHaveBeenCalledWith(qx)
    expect(fill).toHaveBeenCalledWith(qx)
    expect(truncate.mock.invocationCallOrder[0]).toBeLessThan(fill.mock.invocationCallOrder[0])
  })

  it('refuses to run when a registry organization is missing in CDP', async () => {
    const [missing, ...present] = registryOrganizationIds
    existingOrganizationIds.mockResolvedValue(present)

    await expect(prepareIdentityAffiliationsRun()).rejects.toThrow(
      `Akrites member organizations missing in CDP: ${missing}`,
    )
    expect(existingOrganizationIds).toHaveBeenCalledWith(cdpQx, registryOrganizationIds)
    expect(truncate).not.toHaveBeenCalled()
  })

  it('refuses to run when the universe is empty', async () => {
    fill.mockResolvedValue(0)

    await expect(prepareIdentityAffiliationsRun()).rejects.toThrow(
      'Refusing to run identity affiliations: no identities',
    )
  })
})

describe('mergeIdentityAffiliations', () => {
  it('merges staging at the run start, logs and returns the counts', async () => {
    const counts: MergeCounts = {
      inserted: 1,
      changed: 2,
      unchanged: 3,
      removed: 4,
      byMethod: { cdp: 1, email_domain: 2, github_company: 3, unresolved: 4 },
    }
    merge.mockResolvedValue(counts)

    const result = await mergeIdentityAffiliations({ runStartedAt: runStartedAt.toISOString() })

    expect(result).toEqual(counts)
    expect(merge).toHaveBeenCalledWith(qx, runStartedAt)
    expect(log.info).toHaveBeenCalledWith(counts, expect.any(String))
  })
})
