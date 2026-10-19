import { isDomainExcluded, isValidEmail, registrableDomain } from '@crowd/common'
import { disposableEmailDomains } from '@crowd/common/src/constants'
import {
  OrganizationVerifiedPrimaryDomains,
  fetchManyOrganizationVerifiedPrimaryDomains,
} from '@crowd/data-access-layer/src/organizations/identities'
import {
  AKRITES_MEMBERS,
  AkritesMember,
} from '@crowd/data-access-layer/src/osspckgs/akritesMembers'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

import { ResolvedEmailDomainAffiliation, contributorIdentityKey } from './types'

const log = getServiceChildLogger('resolveEmailDomainAffiliations')

interface DomainOwner {
  akritesMember: string
  cdpOrganizationId: string
}

function buildDomainOwners(
  rows: OrganizationVerifiedPrimaryDomains[],
  members: AkritesMember[],
): Map<string, DomainOwner> {
  const domainsByOrgId = new Map(rows.map((row) => [row.orgId, row.domains]))
  const owners = new Map<string, DomainOwner>()
  const conflictingDomains = new Set<string>()

  for (const member of members) {
    for (const cdpOrganizationId of member.cdpOrganizationIds) {
      for (const domain of domainsByOrgId.get(cdpOrganizationId) ?? []) {
        if (isIneligibleDomain(domain) || conflictingDomains.has(domain)) continue
        const owner = owners.get(domain)
        if (!owner) {
          owners.set(domain, { akritesMember: member.name, cdpOrganizationId })
        } else if (owner.akritesMember !== member.name) {
          owners.delete(domain)
          conflictingDomains.add(domain)
        }
      }
    }
  }

  if (conflictingDomains.size > 0) {
    log.warn(
      { conflictingDomains: [...conflictingDomains] },
      'Excluding email domains verified under more than one Akrites member',
    )
  }
  return owners
}

function normalizeEmails(emails: string[]): string[] {
  const normalized = new Set(emails.map((email) => email.trim().toLowerCase()))
  return [...normalized].filter((email) => isValidEmail(email))
}

function candidateDomains(domain: string): string[] {
  const registrable = registrableDomain(domain)
  if (!registrable || !domain.endsWith(registrable)) return [domain]

  const labels = domain.split('.')
  const depth = registrable.split('.').length
  const candidates: string[] = []
  for (let start = 0; labels.length - start >= depth; start++) {
    candidates.push(labels.slice(start).join('.'))
  }
  return candidates
}

function isIneligibleDomain(domain: string): boolean {
  return candidateDomains(domain).some(
    (candidate) => isDomainExcluded(candidate) || disposableEmailDomains.has(candidate),
  )
}

function matchEmail(
  email: string,
  owners: Map<string, DomainOwner>,
): ResolvedEmailDomainAffiliation | undefined {
  const domain = email.slice(email.lastIndexOf('@') + 1)
  if (isIneligibleDomain(domain)) return undefined

  for (const candidate of candidateDomains(domain)) {
    const owner = owners.get(candidate)
    if (owner) {
      return {
        ...owner,
        matchedDomain: candidate,
        confidence: 'email_domain',
        confidenceScore: 0.7,
      }
    }
  }
  return undefined
}

export async function resolveEmailDomainAffiliations(
  cdpQx: QueryExecutor,
  emails: string[],
  members: AkritesMember[] = AKRITES_MEMBERS,
): Promise<Map<string, ResolvedEmailDomainAffiliation>> {
  const resolved = new Map<string, ResolvedEmailDomainAffiliation>()
  if (emails.length === 0) return resolved

  const organizationIds = members.flatMap((member) => member.cdpOrganizationIds)
  const rows = await fetchManyOrganizationVerifiedPrimaryDomains(cdpQx, organizationIds)
  const owners = buildDomainOwners(rows, members)

  for (const email of normalizeEmails(emails)) {
    const affiliation = matchEmail(email, owners)
    if (affiliation)
      resolved.set(contributorIdentityKey({ type: 'email', value: email }), affiliation)
  }
  return resolved
}
