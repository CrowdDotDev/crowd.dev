/* eslint-disable no-constant-condition */
import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities/member-merge-suggestions/getMergeSuggestions'

// import { IProcessGenerateMemberMergeSuggestionsArgs } from '@crowd/types'

import { IProcessGenerateMemberMergeSuggestionsArgs } from '@crowd/types'
import { IMemberPartialAggregatesOpensearch } from 'types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateMemberMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 2000

  let result: IMemberPartialAggregatesOpensearch[]
  let lastUuid: string

  do {
    console.log({ lastUuid, PAGE_SIZE }, `Getting a new page of members from opensearch!`)

    result = await activity.getMembers(args.tenantId, PAGE_SIZE, lastUuid)

    lastUuid = result.length > 0 ? result[result.length - 1]?.uuid_memberId : null

    // get merge suggestions for each member
    for (const member of result) {
      const mergeSuggestions = await activity.getMergeSuggestions(args.tenantId, member)

      if (mergeSuggestions.length > 0) {
        await activity.addToMerge(mergeSuggestions)
      }
    }

    //
  } while (result.length > 0)
}
