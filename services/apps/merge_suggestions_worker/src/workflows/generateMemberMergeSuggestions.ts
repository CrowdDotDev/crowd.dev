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

  let lastGeneratedAt: string = args.lastGeneratedAt || null

  // get the latest generation time of tenant's member suggestions, we'll only get members created after that for new suggestions
  if (!lastGeneratedAt) {
    lastGeneratedAt = await activity.findTenantsLatestMemberSuggestionGeneratedAt(args.tenantId)
  }

  console.log('[generateMemberMergeSuggestions] Last generated at:', lastGeneratedAt)

  const result: IMemberBaseForMergeSuggestions[] = await activity.getMembers(
    args.tenantId,
    PAGE_SIZE,
    lastGeneratedAt,
  )

  const memberIdsToCheck = [
    '91157df0-4bea-11ef-ad53-b9a7b82f79f3',
    '7c392f00-cfb4-11ef-8a7e-077cc09af72d',
    '5d848a60-4bf6-11ef-ac2e-a53cd2b54633',
    '9e0602a0-91ef-11ef-aa37-87428b07a701',
    '640ddc20-cfa8-11ef-ad29-45103991cb8e',
  ]

  // Check if any of our target IDs are in the initial result
  const foundInitialMembers = result.filter((member) => memberIdsToCheck.includes(member.id))
  if (foundInitialMembers.length > 0) {
    console.log(
      '[getMembers] Target members found in initial results:',
      foundInitialMembers.map((member) => member.id),
    )
  }

  if (result.length === 0) {
    await activity.updateMemberMergeSuggestionsLastGeneratedAt(args.tenantId)
    return
  }

  const lastProcessedAt = result.length > 0 ? result[result.length - 1]?.createdAt : null

  console.log('[generateMemberMergeSuggestions] Last processed member createdAt:', lastProcessedAt)

  const allMergeSuggestions: IMemberMergeSuggestion[] = []

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    const mergeSuggestionsPromises: Promise<IMemberMergeSuggestion[]>[] = chunk.map((member) =>
      activity.getMemberMergeSuggestions(args.tenantId, member),
    )

    const mergeSuggestionsResults: IMemberMergeSuggestion[][] =
      await Promise.all(mergeSuggestionsPromises)

    const chunkTargetSuggestions = mergeSuggestionsResults
      .flat()
      .filter((suggestion) =>
        suggestion.members.some((memberId) => memberIdsToCheck.includes(memberId)),
      )

    if (chunkTargetSuggestions.length > 0) {
      console.log(
        '[chunkTargetSuggestions] Found target suggestions in chunk:',
        chunkTargetSuggestions,
      )
    }

    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Add all merge suggestions to add to merge
  if (allMergeSuggestions.length > 0) {
    const mergeSuggestionsToAdd = allMergeSuggestions.filter((s) =>
      s.members.some((memberId) => memberIdsToCheck.includes(memberId)),
    )

    if (mergeSuggestionsToAdd.length > 0) {
      console.log(
        '[mergeSuggestionsToAdd] Found merge suggestions with specified member IDs:',
        mergeSuggestionsToAdd,
      )
    }

    await activity.addMemberToMerge(
      allMergeSuggestions,
      MemberMergeSuggestionTable.MEMBER_TO_MERGE_RAW,
    )

    await activity.addMemberToMerge(
      allMergeSuggestions.filter((s) => s.similarity > SIMILARITY_CONFIDENCE_SCORE_THRESHOLD),
      MemberMergeSuggestionTable.MEMBER_TO_MERGE_FILTERED,
    )
  }

  // if testRun > 3, we'll stop the workflow
  // todo: remove this
  if (args.testRun > 3) {
    return
  }

  await continueAsNew<typeof generateMemberMergeSuggestions>({
    tenantId: args.tenantId,
    lastGeneratedAt: lastProcessedAt,
    testRun: args.testRun + 1,
  })
}
