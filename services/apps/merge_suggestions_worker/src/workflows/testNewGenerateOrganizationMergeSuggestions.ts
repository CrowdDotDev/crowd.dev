import { proxyActivities } from '@temporalio/workflow'

import { IOrganizationBaseForMergeSuggestions, IOrganizationMergeSuggestion } from '@crowd/types'

import * as activities from '../activities/organizationMergeSuggestions'
import { IProcessGenerateOrganizationMergeSuggestionsArgs } from '../types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function testNewGenerateOrganizationMergeSuggestions(
  args: IProcessGenerateOrganizationMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 25
  const PARALLEL_SUGGESTION_PROCESSING = 50

  let lastUuid: string = args?.lastUuid ?? null

  // Dry run - no write operations, just testing the V2 function
  const lastGeneratedAt = await activity.findTenantsLatestOrganizationSuggestionGeneratedAt(
    args?.tenantId,
  )

  const result: IOrganizationBaseForMergeSuggestions[] = await activity.getOrganizations(
    args?.tenantId,
    PAGE_SIZE,
    lastUuid,
    lastGeneratedAt,
    args?.organizationIds,
  )

  lastUuid = result.length > 0 ? result[result.length - 1]?.id : null

  const allMergeSuggestions: IOrganizationMergeSuggestion[] = []

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    // Use V2 function for testing
    const mergeSuggestionsPromises: Promise<IOrganizationMergeSuggestion[]>[] = chunk.map(
      (organization) => activity.getOrganizationMergeSuggestionsV2(args?.tenantId, organization),
    )

    const mergeSuggestionsResults: IOrganizationMergeSuggestion[][] =
      await Promise.all(mergeSuggestionsPromises)
    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Dry run - no writes, just collect suggestions for debugging
  // All debug logs are in the V2 function
}
