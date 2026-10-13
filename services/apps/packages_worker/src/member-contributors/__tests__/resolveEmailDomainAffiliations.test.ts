import { beforeEach, describe, expect, it, vi } from 'vitest'

import { disposableEmailDomains } from '@crowd/common/src/constants'
import * as organizationIdentities from '@crowd/data-access-layer/src/organizations/identities'
import type { OrganizationVerifiedPrimaryDomains } from '@crowd/data-access-layer/src/organizations/identities'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { AkritesMember } from '../registry'
import { resolveEmailDomainAffiliations } from '../resolveEmailDomainAffiliations'

const log = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }))

vi.mock('@crowd/logging', () => ({
  getServiceChildLogger: () => log,
}))
vi.mock('@crowd/data-access-layer/src/organizations/identities', () => ({
  fetchManyOrganizationVerifiedPrimaryDomains: vi.fn(),
}))

const fetchDomains = vi.mocked(organizationIdentities.fetchManyOrganizationVerifiedPrimaryDomains)

const qx = {} as QueryExecutor

const registry: AkritesMember[] = [
  { name: 'Cisco', cdpOrganizationIds: ['cisco-1', 'cisco-2'], aliases: [] },
  { name: 'Google', cdpOrganizationIds: ['google-1'], aliases: [] },
]

function orgDomains(orgId: string, domains: string[]): OrganizationVerifiedPrimaryDomains {
  return { orgId, displayName: orgId, domains }
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchDomains.mockResolvedValue([
    orgDomains('cisco-1', ['cisco.com']),
    orgDomains('google-1', ['google.com']),
  ])
})

describe('resolveEmailDomainAffiliations', () => {
  it('returns empty and issues no query for empty input', async () => {
    const out = await resolveEmailDomainAffiliations(qx, [], registry)
    expect(out.size).toBe(0)
    expect(fetchDomains).not.toHaveBeenCalled()
  })

  it('resolves an email at a member primary domain', async () => {
    const out = await resolveEmailDomainAffiliations(qx, ['jane@cisco.com'], registry)
    expect(out.get('email:jane@cisco.com')).toEqual({
      akritesMember: 'Cisco',
      cdpOrganizationId: 'cisco-1',
      matchedDomain: 'cisco.com',
      confidence: 'email_domain',
      confidenceScore: 0.7,
    })
  })

  it('resolves an email at a subdomain of a member primary domain', async () => {
    const out = await resolveEmailDomainAffiliations(qx, ['dev@eng.google.com'], registry)
    expect(out.get('email:dev@eng.google.com')).toMatchObject({
      akritesMember: 'Google',
      matchedDomain: 'google.com',
    })
  })

  it('never walks past the registrable domain', async () => {
    fetchDomains.mockResolvedValue([orgDomains('cisco-1', ['co.uk'])])
    const out = await resolveEmailDomainAffiliations(qx, ['jane@foo.co.uk'], registry)
    expect(out.size).toBe(0)
  })

  it('never resolves a public email provider listed under a member', async () => {
    fetchDomains.mockResolvedValue([orgDomains('google-1', ['google.com', 'gmail.com'])])
    const out = await resolveEmailDomainAffiliations(
      qx,
      ['jane@gmail.com', 'jane@mail.gmail.com'],
      registry,
    )
    expect(out.size).toBe(0)
  })

  it('never resolves a subdomain of a public email provider listed under a member', async () => {
    fetchDomains.mockResolvedValue([orgDomains('google-1', ['mail.gmail.com'])])
    const out = await resolveEmailDomainAffiliations(qx, ['jane@mail.gmail.com'], registry)
    expect(out.size).toBe(0)
  })

  it('never resolves a disposable domain listed under a member', async () => {
    expect(disposableEmailDomains.has('gmial.com')).toBe(true)
    fetchDomains.mockResolvedValue([orgDomains('google-1', ['google.com', 'gmial.com'])])
    const out = await resolveEmailDomainAffiliations(qx, ['jane@gmial.com'], registry)
    expect(out.size).toBe(0)
  })

  it('omits an email at an unknown domain', async () => {
    const out = await resolveEmailDomainAffiliations(qx, ['jane@acme.io'], registry)
    expect(out.size).toBe(0)
  })

  it('omits invalid emails without throwing', async () => {
    const out = await resolveEmailDomainAffiliations(
      qx,
      ['cisco.com', 'jane@', '@cisco.com', 'jane@@cisco', ''],
      registry,
    )
    expect(out.size).toBe(0)
  })

  it('excludes a domain verified under different members and warns once', async () => {
    const threeMembers = [...registry, { name: 'IBM', cdpOrganizationIds: ['ibm-1'], aliases: [] }]
    fetchDomains.mockResolvedValue([
      orgDomains('cisco-1', ['cisco.com', 'meetup.com']),
      orgDomains('google-1', ['google.com', 'meetup.com']),
      orgDomains('ibm-1', ['meetup.com']),
    ])
    const out = await resolveEmailDomainAffiliations(
      qx,
      ['a@meetup.com', 'b@meetup.com', 'c@cisco.com'],
      threeMembers,
    )
    expect(out.has('email:a@meetup.com')).toBe(false)
    expect(out.has('email:b@meetup.com')).toBe(false)
    expect(out.get('email:c@cisco.com')?.akritesMember).toBe('Cisco')
    expect(log.warn).toHaveBeenCalledTimes(1)
    expect(log.warn).toHaveBeenCalledWith(
      { conflictingDomains: ['meetup.com'] },
      expect.any(String),
    )
  })

  it('picks the first registry org id when one member has the domain under two org ids', async () => {
    const rows = [orgDomains('cisco-2', ['cisco.com']), orgDomains('cisco-1', ['cisco.com'])]

    fetchDomains.mockResolvedValue(rows)
    const first = await resolveEmailDomainAffiliations(qx, ['jane@cisco.com'], registry)
    fetchDomains.mockResolvedValue([...rows].reverse())
    const second = await resolveEmailDomainAffiliations(qx, ['jane@cisco.com'], registry)

    expect(first.get('email:jane@cisco.com')?.cdpOrganizationId).toBe('cisco-1')
    expect(second.get('email:jane@cisco.com')).toEqual(first.get('email:jane@cisco.com'))
    expect(log.warn).not.toHaveBeenCalled()
  })

  it('fetches the domain table once with every registry org id', async () => {
    await resolveEmailDomainAffiliations(qx, ['a@cisco.com', 'b@google.com', 'c@acme.io'], registry)
    expect(fetchDomains).toHaveBeenCalledTimes(1)
    expect(fetchDomains).toHaveBeenCalledWith(qx, ['cisco-1', 'cisco-2', 'google-1'])
  })

  it('treats emails case-insensitively and dedupes them', async () => {
    const out = await resolveEmailDomainAffiliations(
      qx,
      ['Jane@Cisco.com ', ' jane@cisco.COM'],
      registry,
    )
    expect([...out.keys()]).toEqual(['email:jane@cisco.com'])
  })
})
