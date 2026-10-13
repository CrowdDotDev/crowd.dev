import { heartbeat } from '@temporalio/activity'

import {
  IdentityKey,
  StagingAffiliationRow,
  readIdentityAffiliationsStagingPage,
  writeIdentityAffiliationsStagingResults,
} from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { getCdpDb, getPackagesDb } from '../../db'
import { resolveCdpAffiliations } from '../resolveCdpAffiliations'
import { resolveEmailDomainAffiliations } from '../resolveEmailDomainAffiliations'
import { resolveGithubCompanyAffiliationsByHandles } from '../resolveGithubCompanyAffiliations'
import {
  ContributorIdentity,
  ResolvedEmailDomainAffiliation,
  ResolvedGithubCompanyAffiliation,
  contributorIdentityKey,
} from '../types'
import { ChunkMethodCounts, emptyChunkCounts } from './counts'
import { pickBestAffiliation } from './pickBestAffiliation'

export type { ChunkMethodCounts } from './counts'

export interface ResolveChunkInput {
  runStartedAt: string
  afterKey: IdentityKey | null
  limit: number
}

export interface ResolveChunkResult {
  lastKey: IdentityKey | null
  read: number
  counts: ChunkMethodCounts
}

function toContributorIdentity(key: IdentityKey): ContributorIdentity {
  return { type: key.identityType, value: key.identityValue }
}

function valuesOfType(identities: ContributorIdentity[], type: ContributorIdentity['type']) {
  return identities.filter((identity) => identity.type === type).map((identity) => identity.value)
}

async function resolveEmailDomainsIfAny(
  cdpQx: QueryExecutor,
  emails: string[],
): Promise<Map<string, ResolvedEmailDomainAffiliation>> {
  return emails.length > 0 ? resolveEmailDomainAffiliations(cdpQx, emails) : new Map()
}

async function resolveGithubCompaniesIfAny(
  cdpQx: QueryExecutor,
  handles: string[],
): Promise<Map<string, ResolvedGithubCompanyAffiliation>> {
  return handles.length > 0 ? resolveGithubCompanyAffiliationsByHandles(cdpQx, handles) : new Map()
}

async function resolvePage(
  cdpQx: QueryExecutor,
  page: IdentityKey[],
): Promise<StagingAffiliationRow[]> {
  const identities = page.map(toContributorIdentity)
  const cdp = await resolveCdpAffiliations(cdpQx, identities)
  const emailDomain = await resolveEmailDomainsIfAny(cdpQx, valuesOfType(identities, 'email'))
  const githubCompany = await resolveGithubCompaniesIfAny(
    cdpQx,
    valuesOfType(identities, 'github-login'),
  )

  return page.map((key, i) => {
    const identityKey = contributorIdentityKey(identities[i])
    return {
      ...key,
      ...pickBestAffiliation(
        cdp.get(identityKey),
        emailDomain.get(identityKey),
        githubCompany.get(identityKey),
      ),
    }
  })
}

function countByMethod(rows: StagingAffiliationRow[]): ChunkMethodCounts {
  const counts = emptyChunkCounts()
  for (const row of rows) {
    counts[row.confidence ?? 'unresolved'] += 1
  }
  return counts
}

export async function resolveIdentityAffiliationsChunk(
  input: ResolveChunkInput,
): Promise<ResolveChunkResult> {
  const pkgsQx = await getPackagesDb()
  const page = await readIdentityAffiliationsStagingPage(pkgsQx, input.afterKey, input.limit)
  if (page.length === 0) {
    return { lastKey: null, read: 0, counts: emptyChunkCounts() }
  }

  const cdpQx = await getCdpDb()
  const rows = await resolvePage(cdpQx, page)
  await writeIdentityAffiliationsStagingResults(pkgsQx, rows, new Date(input.runStartedAt))

  const counts = countByMethod(rows)
  heartbeat(counts)
  return { lastKey: page[page.length - 1], read: page.length, counts }
}
