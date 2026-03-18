import { proxyActivities } from '@temporalio/workflow'

import { IOrganizationBaseForMergeSuggestions, IOrganizationMergeSuggestion } from '@crowd/types'

import * as activities from '../activities/organizationMergeSuggestions'
import { IProcessGenerateOrganizationMergeSuggestionsArgs } from '../types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function testOrganizationMergeSuggestions(
  args: IProcessGenerateOrganizationMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 25
  const PARALLEL_SUGGESTION_PROCESSING = 50

  const result: IOrganizationBaseForMergeSuggestions[] = await activity.getOrganizations(
    args.tenantId,
    PAGE_SIZE,
    null,
    null,
    args.organizationIds,
  )

  if (result.length === 0) {
    console.log('No organizations found for merge suggestion test!')
    return
  }

  const allMergeSuggestions: IOrganizationMergeSuggestion[] = []

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    const mergeSuggestionsPromises: Promise<IOrganizationMergeSuggestion[]>[] = chunk.map(
      (organization) => activity.getOrganizationMergeSuggestions(args.tenantId, organization),
    )

    const mergeSuggestionsResults: IOrganizationMergeSuggestion[][] =
      await Promise.all(mergeSuggestionsPromises)
    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Add all merge suggestions to add to merge
  if (allMergeSuggestions.length > 0) {
    console.log('Found merge suggestions!', allMergeSuggestions)
  } else {
    console.log('No merge suggestions found for provided organizations!')
  }
}
