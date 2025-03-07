import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import {
  IMemberBaseForMergeSuggestions,
  IMemberMergeSuggestion,
  MemberMergeSuggestionTable,
} from '@crowd/types'

import * as activities from '../activities/memberMergeSuggestions'
import { IProcessGenerateMemberMergeSuggestionsArgs } from '../types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateMemberMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 50
  const PARALLEL_SUGGESTION_PROCESSING = 10
  const SIMILARITY_CONFIDENCE_SCORE_THRESHOLD = 0.75

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

    const mergeSuggestionsResults: IMemberMergeSuggestion[][] =
      await Promise.all(mergeSuggestionsPromises)
    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Add all merge suggestions to add to merge
  if (allMergeSuggestions.length > 0) {
    const memberIdsToCheck = [
      '91157df0-4bea-11ef-ad53-b9a7b82f79f3',
      '7c392f00-cfb4-11ef-8a7e-077cc09af72d',
      '5d848a60-4bf6-11ef-ac2e-a53cd2b54633',
      '9e0602a0-91ef-11ef-aa37-87428b07a701',
      '640ddc20-cfa8-11ef-ad29-45103991cb8e',
    ]

    const mergeSuggestionsToAdd = allMergeSuggestions.filter((s) =>
      s.members.some((memberId) => memberIdsToCheck.includes(memberId)),
    )

    if (mergeSuggestionsToAdd.length > 0) {
      console.log('Found merge suggestions with specified member IDs:', mergeSuggestionsToAdd)
    }

    console.log(mergeSuggestionsToAdd)

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
