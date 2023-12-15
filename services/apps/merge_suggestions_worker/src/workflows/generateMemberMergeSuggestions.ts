/* eslint-disable no-constant-condition */
import { proxyActivities } from '@temporalio/workflow'
import * as activitiesOne from '../activities/member-merge-suggestions/getMembers'
import * as activitiesTwo from '../activities/member-merge-suggestions/getMergeSuggestions'

// import { IProcessGenerateMemberMergeSuggestionsArgs } from '@crowd/types'

import { IProcessGenerateMemberMergeSuggestionsArgs } from '@crowd/types'
import { IMemberPartialAggregatesOpensearch } from 'types'

const activity = proxyActivities<typeof activitiesOne>({ startToCloseTimeout: '1 minute' })

const activity2 = proxyActivities<typeof activitiesTwo>({ startToCloseTimeout: '1 minute' })

export async function generateMemberMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  console.log(`Hallo Welt! ${args.tenantId} `)

  const PAGE_SIZE = 5

  let result: IMemberPartialAggregatesOpensearch[]
  let lastUuid: string

  do {
    console.log({ lastUuid, PAGE_SIZE }, `Getting a new page of members from opensearch!`)

    result = await activity.getMembers(args.tenantId, 5, lastUuid)

    lastUuid = result.length > 0 ? result[result.length - 1]?.uuid_memberId : null

    // get merge suggestions for each member
    for (const member of result) {
      const mergeSuggestions = await activity2.getMergeSuggestions(args.tenantId, member)

      if (mergeSuggestions.length > 0) {
        await activity2.addToMerge(mergeSuggestions)
      }
    }

    //
  } while (result.length > 0)

  // console.log('Got some members from opensearch!')
  // console.log(result)
}
