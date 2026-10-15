import {
  IdentityKey,
  findIdentityKeysWithoutAffiliation,
  insertIdentityAffiliations,
} from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'

import { getCdpDb, getPackagesDb } from '../../db'
import { ChunkMethodCounts, emptyChunkCounts } from '../affiliations/counts'
import { countByMethod, resolveIdentityPage } from '../affiliations/resolveChunk'
import { readRunStart } from '../governance/syncGovernanceContributors'

export interface ResolveNewIdentityAffiliationsInput {
  logins: string[]
}

export interface ResolveNewIdentityAffiliationsResult {
  identities: number
  inserted: number
  counts: ChunkMethodCounts
}

function nothingResolved(): ResolveNewIdentityAffiliationsResult {
  return { identities: 0, inserted: 0, counts: emptyChunkCounts() }
}

function toLoginKeys(logins: string[]): IdentityKey[] {
  return logins.map((identityValue) => ({ identityType: 'github-login', identityValue }))
}

export async function resolveNewIdentityAffiliations(
  input: ResolveNewIdentityAffiliationsInput,
): Promise<ResolveNewIdentityAffiliationsResult> {
  if (input.logins.length === 0) {
    return nothingResolved()
  }
  const pkgsQx = await getPackagesDb()
  const missing = await findIdentityKeysWithoutAffiliation(pkgsQx, toLoginKeys(input.logins))
  if (missing.length === 0) {
    return nothingResolved()
  }
  const resolvedAt = await readRunStart(pkgsQx)
  const rows = await resolveIdentityPage(await getCdpDb(), missing)
  const inserted = await insertIdentityAffiliations(pkgsQx, rows, resolvedAt)
  return { identities: missing.length, inserted, counts: countByMethod(rows) }
}
