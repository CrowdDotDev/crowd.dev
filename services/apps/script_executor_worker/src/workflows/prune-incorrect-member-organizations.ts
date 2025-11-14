import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IScriptBatchTestArgs } from '../types'
import { chunkArray } from '../utils/common'

const { getMemberOrganizationsToPrune, pruneMemberOrganization, refreshMemberAffiliations } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 minutes',
    retry: { maximumAttempts: 3, backoffCoefficient: 3 },
  })

export async function pruneIncorrectMemberOrganizations(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const memberOrganizationsToPrune = await getMemberOrganizationsToPrune(BATCH_SIZE)

  if (memberOrganizationsToPrune.length === 0) {
    console.log('No more member organizations to prune!')
    return
  }

  const memberIdsToRefresh = new Set<string>()
  const CHUNK_SIZE = 25

  for (const chunk of chunkArray(memberOrganizationsToPrune, CHUNK_SIZE)) {
    const cleanupTasks = chunk.map(async (mo) => {
      console.log('Pruning member organization', mo.id)
      await pruneMemberOrganization(mo.id, mo.memberId)
      memberIdsToRefresh.add(mo.memberId)
    })

    await Promise.all(cleanupTasks).catch((err) => {
      console.error('Error pruning member organizations!', err)
    })
  }

  for (const memberId of memberIdsToRefresh) {
    console.log('Refreshing member affiliations', memberId)
    await refreshMemberAffiliations(memberId)
  }
}
