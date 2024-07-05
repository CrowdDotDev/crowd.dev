import { proxyActivities, continueAsNew } from '@temporalio/workflow'
import * as activities from '../activities/memberMergeSuggestions'

import { IProcessGenerateMemberMergeSuggestionsArgs } from '../types'
import {
  IMemberBaseForMergeSuggestions,
  IMemberMergeSuggestion,
  MemberMergeSuggestionTable,
} from '@crowd/types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateMemberMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 50
  const PARALLEL_SUGGESTION_PROCESSING = 10
  const SIMILARITY_CONFIDENCE_SCORE_THRESHOLD = 0.5

  let lastUuid: string = args.lastUuid || null

  // get the latest generation time of tenant's member suggestions, we'll only get members created after that for new suggestions
  const lastGeneratedAt = await activity.findTenantsLatestMemberSuggestionGeneratedAt(args.tenantId)

  const result: IMemberBaseForMergeSuggestions[] = await activity.getMembers(
    args.tenantId,
    PAGE_SIZE,
    lastUuid,
    lastGeneratedAt,
  )

  if (result.length === 0) {
    await activity.updateMemberMergeSuggestionsLastGeneratedAt(args.tenantId)
    return
  }

  lastUuid = result.length > 0 ? result[result.length - 1]?.id : null

  const allMergeSuggestions: IMemberMergeSuggestion[] = []

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    const mergeSuggestionsPromises: Promise<IMemberMergeSuggestion[]>[] = chunk.map((member) =>
      activity.getMemberMergeSuggestions(args.tenantId, member),
    )

    const mergeSuggestionsResults: IMemberMergeSuggestion[][] = await Promise.all(
      mergeSuggestionsPromises,
    )
    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Add all merge suggestions to add to merge
  if (allMergeSuggestions.length > 0) {
    await activity.addMemberToMerge(
      allMergeSuggestions,
      MemberMergeSuggestionTable.MEMBER_TO_MERGE_RAW,
    )

    await activity.addMemberToMerge(
      allMergeSuggestions.filter((s) => s.similarity > SIMILARITY_CONFIDENCE_SCORE_THRESHOLD),
      MemberMergeSuggestionTable.MEMBER_TO_MERGE_FILTERED,
    )
  }

  await continueAsNew<typeof generateMemberMergeSuggestions>({ tenantId: args.tenantId, lastUuid })
}
