import { proxyActivities, continueAsNew } from '@temporalio/workflow'
import * as activities from '../activities/member-merge-suggestions/getMergeSuggestions'

import { IMemberMergeSuggestion, IProcessGenerateMemberMergeSuggestionsArgs } from '@crowd/types'
import { IMemberPartialAggregatesOpensearch } from 'types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateMemberMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 1000
  const PARALLEL_SUGGESTION_PROCESSING = 200

  let lastUuid: string = args.lastUuid || null

  // get the latest generation time of tenant's member suggestions, we'll only get members created after that for new suggestions
  const lastGeneratedAt = await activity.findTenantsLatestMemberSuggestionGeneratedAt(args.tenantId)

  const result: IMemberPartialAggregatesOpensearch[] = await activity.getMembers(
    args.tenantId,
    PAGE_SIZE,
    lastUuid,
    lastGeneratedAt,
  )

  if (result.length === 0) {
    await activity.updateMemberMergeSuggestionsLastGeneratedAt(args.tenantId)
    return
  }

  lastUuid = result.length > 0 ? result[result.length - 1]?.uuid_memberId : null

  // Gather all promises for merge suggestions
  const mergeSuggestionsPromises: Promise<IMemberMergeSuggestion[]>[] = result.map((member) =>
    activity.getMergeSuggestions(args.tenantId, member),
  )

  const promiseChunks = chunkArray<Promise<IMemberMergeSuggestion[]>>(
    mergeSuggestionsPromises,
    PARALLEL_SUGGESTION_PROCESSING,
  )

  const allMergeSuggestions: IMemberMergeSuggestion[] = []

  for (const promiseChunk of promiseChunks) {
    const mergeSuggestionsResults: IMemberMergeSuggestion[][] = await Promise.all(promiseChunk)
    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Add all merge suggestions to add to merge
  if (allMergeSuggestions.length > 0) {
    await activity.addToMerge(allMergeSuggestions)
  }

  await continueAsNew<typeof generateMemberMergeSuggestions>({ tenantId: args.tenantId, lastUuid })
}
