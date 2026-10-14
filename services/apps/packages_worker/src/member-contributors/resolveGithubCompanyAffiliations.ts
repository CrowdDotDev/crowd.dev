import { findGithubProfileCompaniesByHandles } from '@crowd/data-access-layer/src/members/identities'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { AKRITES_MEMBERS, AkritesMember } from './registry'
import { ResolvedGithubCompanyAffiliation, contributorIdentityKey } from './types'

const NEGATION_TOKENS = new Set([
  'ex',
  'former',
  'formerly',
  'previously',
  'prev',
  'past',
  'alum',
  'alumni',
])

interface AliasMatch {
  member: AkritesMember
  aliasIndex: number
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0)
}

function containsSequence(tokens: string[], sequence: string[]): boolean {
  if (sequence.length === 0) return false
  for (let start = 0; start + sequence.length <= tokens.length; start++) {
    if (sequence.every((token, offset) => tokens[start + offset] === token)) return true
  }
  return false
}

function findAliasMatch(tokens: string[], member: AkritesMember): AliasMatch | undefined {
  const aliasIndex = member.aliases.findIndex((alias) => containsSequence(tokens, tokenize(alias)))
  return aliasIndex === -1 ? undefined : { member, aliasIndex }
}

function findUniqueAliasMatch(company: string, members: AkritesMember[]): AliasMatch | undefined {
  const tokens = tokenize(company)
  if (tokens.length === 0 || tokens.some((token) => NEGATION_TOKENS.has(token))) return undefined

  const matches = members.flatMap((member) => findAliasMatch(tokens, member) ?? [])
  return matches.length === 1 ? matches[0] : undefined
}

function toAffiliation({ member, aliasIndex }: AliasMatch): ResolvedGithubCompanyAffiliation {
  return {
    akritesMember: member.name,
    cdpOrganizationId: member.cdpOrganizationIds[0],
    matchedAlias: member.aliases[aliasIndex],
    confidence: 'github_company',
    confidenceScore: 0.3,
  }
}

function agreedAliasMatch(matches: AliasMatch[]): AliasMatch | undefined {
  if (matches.length === 0) return undefined
  if (matches.some((match) => match.member !== matches[0].member)) return undefined
  return matches.reduce((best, match) => (match.aliasIndex < best.aliasIndex ? match : best))
}

function normalizeHandles(githubLogins: string[]): string[] {
  return [...new Set(githubLogins.map((login) => login.trim().toLowerCase()))].filter(
    (login) => login.length > 0,
  )
}

export function matchGithubCompany(
  company: string,
  members: AkritesMember[] = AKRITES_MEMBERS,
): ResolvedGithubCompanyAffiliation | undefined {
  const match = findUniqueAliasMatch(company, members)
  return match ? toAffiliation(match) : undefined
}

export function resolveGithubCompanyAffiliations(
  companies: string[],
  members: AkritesMember[] = AKRITES_MEMBERS,
): Map<string, ResolvedGithubCompanyAffiliation> {
  const resolved = new Map<string, ResolvedGithubCompanyAffiliation>()
  for (const company of companies) {
    const trimmed = company.trim()
    if (trimmed.length === 0 || resolved.has(trimmed)) continue
    const affiliation = matchGithubCompany(trimmed, members)
    if (affiliation) resolved.set(trimmed, affiliation)
  }
  return resolved
}

export async function resolveGithubCompanyAffiliationsByHandles(
  cdpQx: QueryExecutor,
  githubLogins: string[],
  members: AkritesMember[] = AKRITES_MEMBERS,
): Promise<Map<string, ResolvedGithubCompanyAffiliation>> {
  const resolved = new Map<string, ResolvedGithubCompanyAffiliation>()
  const handles = normalizeHandles(githubLogins)
  if (handles.length === 0) return resolved

  const rows = await findGithubProfileCompaniesByHandles(cdpQx, handles)

  const matchesByHandle = new Map<string, AliasMatch[]>()
  for (const row of rows) {
    const matches = matchesByHandle.get(row.githubHandle) ?? []
    const match = findUniqueAliasMatch(row.company, members)
    if (match) matches.push(match)
    matchesByHandle.set(row.githubHandle, matches)
  }

  for (const [handle, matches] of matchesByHandle) {
    const agreed = agreedAliasMatch(matches)
    if (agreed) {
      resolved.set(
        contributorIdentityKey({ type: 'github-login', value: handle }),
        toAffiliation(agreed),
      )
    }
  }
  return resolved
}
