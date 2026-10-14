import { describe, expect, it } from 'vitest'

import {
  AKRITES_MEMBERS,
  AkritesMember,
  canonicalCdpOrganizationId,
  canonicalCdpOrganizationIdByMemberName,
} from './akritesMembers'

const aws: AkritesMember = { name: 'AWS', cdpOrganizationIds: ['aws-1', 'aws-2'], aliases: ['aws'] }
const ibm: AkritesMember = { name: 'IBM', cdpOrganizationIds: ['ibm-1'], aliases: ['ibm'] }

describe('canonicalCdpOrganizationId', () => {
  it('is the first organization id of the member', () => {
    expect(canonicalCdpOrganizationId(aws)).toBe('aws-1')
    expect(canonicalCdpOrganizationId(ibm)).toBe('ibm-1')
  })
})

describe('canonicalCdpOrganizationIdByMemberName', () => {
  it('maps every member name to its canonical id and unknown names to undefined', () => {
    const byName = canonicalCdpOrganizationIdByMemberName([aws, ibm])
    expect(byName.get('AWS')).toBe('aws-1')
    expect(byName.get('IBM')).toBe('ibm-1')
    expect(byName.get('Google')).toBeUndefined()
  })
})

describe('AKRITES_MEMBERS', () => {
  it('gives every member at least one organization id, unique across members', () => {
    const ids = AKRITES_MEMBERS.flatMap((member) => member.cdpOrganizationIds)
    expect(AKRITES_MEMBERS.every((member) => member.cdpOrganizationIds.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(AKRITES_MEMBERS.map((member) => member.name)).size).toBe(AKRITES_MEMBERS.length)
  })
})
