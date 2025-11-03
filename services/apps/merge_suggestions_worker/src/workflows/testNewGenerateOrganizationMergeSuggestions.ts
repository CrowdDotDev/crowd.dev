import { proxyActivities } from '@temporalio/workflow'

import { IOrganizationBaseForMergeSuggestions, IOrganizationMergeSuggestion } from '@crowd/types'

import * as activities from '../activities'
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

    // Log summary for this chunk
    const chunkTotal = mergeSuggestionsResults.reduce((sum, arr) => sum + arr.length, 0)
    console.log(
      `[TEST] Processed chunk of ${chunk.length} organizations, generated ${chunkTotal} merge suggestions`,
    )
  }

  // Log final summary of all merge suggestions
  console.log(
    `[TEST] Total merge suggestions generated: ${allMergeSuggestions.length} for ${result.length} organizations`,
  )

  if (allMergeSuggestions.length > 0) {
    // Group by similarity score ranges for analysis
    const highSimilarity = allMergeSuggestions.filter((s) => s.similarity >= 0.8).length
    const mediumSimilarity = allMergeSuggestions.filter(
      (s) => s.similarity >= 0.5 && s.similarity < 0.8,
    ).length
    const lowSimilarity = allMergeSuggestions.filter((s) => s.similarity < 0.5).length

    console.log(`[TEST] Similarity score distribution:`)
    console.log(`[TEST]   High (>=0.8): ${highSimilarity}`)
    console.log(`[TEST]   Medium (0.5-0.8): ${mediumSimilarity}`)
    console.log(`[TEST]   Low (<0.5): ${lowSimilarity}`)

    // Log top 10 suggestions by similarity
    const topSuggestions = allMergeSuggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
    console.log(`[TEST] Top 10 merge suggestions by similarity:`)
    topSuggestions.forEach((suggestion, index) => {
      console.log(
        `[TEST]   ${index + 1}. Similarity: ${suggestion.similarity}, Organizations: [${suggestion.organizations[0]}, ${suggestion.organizations[1]}]`,
      )
    })
  }

  // Dry run - no writes, just collect suggestions for debugging
  // All debug logs are in the V2 function
}
