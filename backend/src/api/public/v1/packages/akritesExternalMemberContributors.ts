import type {
  AffiliatedMemberIdentityRow,
  AffiliationConfidence,
  MemberContributorsPackageRow,
  MemberIdentitySource,
} from '@crowd/data-access-layer'

import { toNullableNumber } from './mappers'

export interface AkritesExternalMemberOrganization {
  id: string
  name: string
  confidence: AffiliationConfidence
  confidenceScore: number
}

export interface AkritesExternalMemberEntry {
  githubLogin: string | null
  displayName: string | null
  emails: string[]
  registryUsernames: string[]
  sources: MemberIdentitySource[]
  organization: AkritesExternalMemberOrganization
}

export interface AkritesExternalRegistryMaintainer extends AkritesExternalMemberEntry {
  roles: string[]
}

export interface AkritesExternalGovernanceRole {
  role: string
  roleKind: string
  current: boolean
}

export interface AkritesExternalGovernanceMaintainer extends AkritesExternalMemberEntry {
  roles: AkritesExternalGovernanceRole[]
}

export interface MemberContributorsSections {
  contributors: AkritesExternalMemberEntry[]
  registry: AkritesExternalRegistryMaintainer[]
  governanceFiles: AkritesExternalGovernanceMaintainer[]
}

export interface AkritesExternalMemberContributors {
  purl: string
  name: string
  ecosystem: string
  repoUrl: string | null
  repoMappingConfidence: number | null
  status: 'collected' | 'not_collected'
  contributors: AkritesExternalMemberEntry[]
  maintainers: {
    registry: AkritesExternalRegistryMaintainer[]
    governanceFiles: AkritesExternalGovernanceMaintainer[]
  }
}

type AffiliatedRow = AffiliatedMemberIdentityRow & {
  akritesMember: string
  cdpOrganizationId: string
  confidence: AffiliationConfidence
  confidenceScore: string | number
}

const GITHUB_LOGIN_SHAPE = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/

const CONFIDENCE_METHOD_RANK: Record<AffiliationConfidence, number> = {
  cdp: 0,
  email_domain: 1,
  github_company: 2,
}

const CONTRIBUTOR_SOURCES: ReadonlySet<MemberIdentitySource> = new Set(['git_activity', 'github'])

function compareStrings(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function compareNullableStrings(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return compareStrings(a, b)
}

function compareRecentFirst(a: Date | null, b: Date | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return b.getTime() - a.getTime()
}

function distinctSorted<T extends string>(values: (T | null)[]): T[] {
  const present = values.filter((value): value is T => value !== null)
  return [...new Set(present)].sort(compareStrings)
}

function isAffiliated(row: AffiliatedMemberIdentityRow): row is AffiliatedRow {
  return (
    row.akritesMember !== null &&
    row.cdpOrganizationId !== null &&
    row.confidence !== null &&
    row.confidenceScore !== null
  )
}

function groupByPerson(
  rows: AffiliatedMemberIdentityRow[],
): Map<string, AffiliatedMemberIdentityRow[]> {
  const groups = new Map<string, AffiliatedMemberIdentityRow[]>()
  for (const row of rows) {
    const group = groups.get(row.person)
    if (group) group.push(row)
    else groups.set(row.person, [row])
  }
  return groups
}

function compareLoginRows(a: AffiliatedMemberIdentityRow, b: AffiliatedMemberIdentityRow): number {
  const shapeOrder =
    Number(GITHUB_LOGIN_SHAPE.test(b.identityValue)) -
    Number(GITHUB_LOGIN_SHAPE.test(a.identityValue))
  return (
    shapeOrder ||
    compareRecentFirst(a.lastSeenAt, b.lastSeenAt) ||
    compareStrings(a.identityValue, b.identityValue)
  )
}

function pickGithubLogin(rows: AffiliatedMemberIdentityRow[]): string | null {
  const [best] = rows.filter((row) => row.identityType === 'github-login').sort(compareLoginRows)
  return best?.identityValue ?? null
}

function pickDisplayName(rows: AffiliatedMemberIdentityRow[]): string | null {
  const [latestAuthorName] = rows
    .filter((row) => row.identityType === 'git-author-name')
    .sort((a, b) => compareRecentFirst(a.lastSeenAt, b.lastSeenAt))
  if (latestAuthorName) return latestAuthorName.identityValue
  return rows.find((row) => row.registryDisplayName !== null)?.registryDisplayName ?? null
}

function compareAffiliations(a: AffiliatedRow, b: AffiliatedRow): number {
  return (
    Number(b.confidenceScore) - Number(a.confidenceScore) ||
    compareRecentFirst(a.lastSeenAt, b.lastSeenAt) ||
    CONFIDENCE_METHOD_RANK[a.confidence] - CONFIDENCE_METHOD_RANK[b.confidence]
  )
}

function pickOrganization(
  rows: AffiliatedMemberIdentityRow[],
): AkritesExternalMemberOrganization | null {
  const [best] = rows.filter(isAffiliated).sort(compareAffiliations)
  if (!best) return null
  return {
    id: best.cdpOrganizationId,
    name: best.akritesMember,
    confidence: best.confidence,
    confidenceScore: Number(best.confidenceScore),
  }
}

function toMemberEntry(rows: AffiliatedMemberIdentityRow[]): AkritesExternalMemberEntry | null {
  const organization = pickOrganization(rows)
  if (!organization) return null
  return {
    githubLogin: pickGithubLogin(rows),
    displayName: pickDisplayName(rows),
    emails: distinctSorted(
      rows.map((row) => (row.identityType === 'email' ? row.identityValue : null)),
    ),
    registryUsernames: distinctSorted(rows.map((row) => row.registryUsername)),
    sources: distinctSorted(rows.map((row) => row.source)),
    organization,
  }
}

function registryRoles(rows: AffiliatedMemberIdentityRow[]): string[] {
  return distinctSorted(rows.filter((row) => row.source === 'registry').map((row) => row.role))
}

function isGovernanceRoleRow(
  row: AffiliatedMemberIdentityRow,
): row is AffiliatedMemberIdentityRow & { role: string } {
  return row.source === 'governance_file' && row.role !== null
}

function governanceRoles(rows: AffiliatedMemberIdentityRow[]): AkritesExternalGovernanceRole[] {
  return rows
    .filter(isGovernanceRoleRow)
    .map((row) => ({
      role: row.role,
      roleKind: row.roleKind,
      current: row.endedAt === null && row.roleKind !== 'emeritus',
    }))
    .sort((a, b) => compareStrings(a.role, b.role))
}

function compareEntries(a: AkritesExternalMemberEntry, b: AkritesExternalMemberEntry): number {
  return (
    compareStrings(a.organization.name, b.organization.name) ||
    compareNullableStrings(a.githubLogin, b.githubLogin) ||
    compareNullableStrings(a.emails[0] ?? null, b.emails[0] ?? null)
  )
}

function hasSource(
  rows: AffiliatedMemberIdentityRow[],
  matches: (source: MemberIdentitySource) => boolean,
): boolean {
  return rows.some((row) => matches(row.source))
}

export function groupAffiliatedMemberIdentities(
  rows: AffiliatedMemberIdentityRow[],
): MemberContributorsSections {
  const sections: MemberContributorsSections = {
    contributors: [],
    registry: [],
    governanceFiles: [],
  }
  for (const personRows of groupByPerson(rows).values()) {
    const entry = toMemberEntry(personRows)
    if (!entry) continue
    if (hasSource(personRows, (source) => CONTRIBUTOR_SOURCES.has(source))) {
      sections.contributors.push(entry)
    }
    if (hasSource(personRows, (source) => source === 'registry')) {
      sections.registry.push({ ...entry, roles: registryRoles(personRows) })
    }
    if (hasSource(personRows, (source) => source === 'governance_file')) {
      sections.governanceFiles.push({ ...entry, roles: governanceRoles(personRows) })
    }
  }
  return {
    contributors: sections.contributors.sort(compareEntries),
    registry: sections.registry.sort(compareEntries),
    governanceFiles: sections.governanceFiles.sort(compareEntries),
  }
}

export function toAkritesExternalMemberContributors(
  pkg: MemberContributorsPackageRow,
  sections: MemberContributorsSections,
): AkritesExternalMemberContributors {
  return {
    purl: pkg.purl,
    name: pkg.name,
    ecosystem: pkg.ecosystem,
    repoUrl: pkg.repoUrl,
    repoMappingConfidence: toNullableNumber(pkg.repoMappingConfidence),
    status: pkg.hasContributorRows ? 'collected' : 'not_collected',
    contributors: sections.contributors,
    maintainers: {
      registry: sections.registry,
      governanceFiles: sections.governanceFiles,
    },
  }
}
