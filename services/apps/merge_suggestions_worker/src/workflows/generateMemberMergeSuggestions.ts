import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/member-merge-suggestions/getMergeSuggestions'

import { IMemberMergeSuggestion, IProcessGenerateMemberMergeSuggestionsArgs } from '@crowd/types'
import { IMemberPartialAggregatesOpensearch } from 'types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateMemberMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 50

  let result: IMemberPartialAggregatesOpensearch[]
  let lastUuid: string

  do {
    result = await activity.getMembers(args.tenantId, PAGE_SIZE, lastUuid)

    lastUuid = result.length > 0 ? result[result.length - 1]?.uuid_memberId : null

    // Gather all promises for merge suggestions
    const mergeSuggestionsPromises: Promise<IMemberMergeSuggestion[]>[] = result.map((member) =>
      activity.getMergeSuggestions(args.tenantId, member),
    )

    // Wait for all merge suggestion promises to resolve
    const mergeSuggestionsResults: IMemberMergeSuggestion[][] =
      await Promise.all(mergeSuggestionsPromises)

    // concat resulting arrays
    const allMergeSuggestions: IMemberMergeSuggestion[] = [].concat(...mergeSuggestionsResults)

    // Add all merge suggestions to add to merge
    if (allMergeSuggestions.length > 0) {
      await activity.addToMerge(allMergeSuggestions)
    }
  } while (result.length > 0)
}
