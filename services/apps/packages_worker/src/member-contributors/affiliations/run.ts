import { findExistingOrganizationIds } from '@crowd/data-access-layer/src/organizations/base'
import { AKRITES_MEMBERS } from '@crowd/data-access-layer/src/osspckgs/akritesMembers'
import {
  MergeCounts,
  fillIdentityAffiliationsStaging,
  mergeIdentityAffiliationsStaging,
  truncateIdentityAffiliationsStaging,
} from '@crowd/data-access-layer/src/osspckgs/identityAffiliations'
import { getServiceChildLogger } from '@crowd/logging'

import { getCdpDb, getPackagesDb } from '../../db'
import { readRunStart } from '../governance/syncGovernanceContributors'

const log = getServiceChildLogger('identityAffiliations')

export interface PrepareRunResult {
  runStartedAt: string
  identities: number
}

export interface MergeInput {
  runStartedAt: string
}

async function assertAkritesMemberOrganizationsExist(): Promise<void> {
  const registryIds = AKRITES_MEMBERS.flatMap((member) => member.cdpOrganizationIds)
  const existing = new Set(await findExistingOrganizationIds(await getCdpDb(), registryIds))
  const missing = registryIds.filter((id) => !existing.has(id))
  if (missing.length > 0) {
    throw new Error(`Akrites member organizations missing in CDP: ${missing.join(', ')}`)
  }
}

export async function prepareIdentityAffiliationsRun(): Promise<PrepareRunResult> {
  await assertAkritesMemberOrganizationsExist()
  const pkgsQx = await getPackagesDb()
  const runStartedAt = await readRunStart(pkgsQx)

  await truncateIdentityAffiliationsStaging(pkgsQx)
  const identities = await fillIdentityAffiliationsStaging(pkgsQx)
  if (identities === 0) {
    throw new Error('Refusing to run identity affiliations: no identities')
  }

  log.info({ identities }, 'Identity affiliations staging filled')
  return { runStartedAt: runStartedAt.toISOString(), identities }
}

export async function mergeIdentityAffiliations(input: MergeInput): Promise<MergeCounts> {
  const pkgsQx = await getPackagesDb()
  const counts = await mergeIdentityAffiliationsStaging(pkgsQx, new Date(input.runStartedAt))
  log.info(counts, 'Identity affiliations merged')
  return counts
}
