import { proxyActivities } from '@temporalio/workflow'

import { IOrganizationBaseForMergeSuggestions } from '@crowd/types'

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

  if (result.length === 0) {
    console.log('[TEST] No organizations found to process')
    return
  }

  console.log(`[TEST] Processing ${result.length} organizations with V2`)

  lastUuid = result.length > 0 ? result[result.length - 1]?.id : null

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    const chunkPromises = chunk.map(async (organization) => {
      console.log(`[TEST] Processing ${organization.id}`)

      const startTime = Date.now()

      const suggestions = await activity.getOrganizationMergeSuggestions(
        args?.tenantId,
        organization,
      )

      const duration = Date.now() - startTime

      // Log summary with key metrics
      console.log(
        `[TEST] ✓ ${organization.id} (${organization.displayName}): ` +
          `${suggestions.length} suggestions in ${duration}ms`,
      )

      // Log all suggestions sorted by similarity
      if (suggestions.length > 0) {
        const sortedSuggestions = suggestions.sort((a, b) => b.similarity - a.similarity)
        console.log(`[TEST]   All suggestions:`)
        sortedSuggestions.forEach((suggestion, index) => {
          console.log(
            `[TEST]     ${index + 1}. ${suggestion.organizations.join(' <-> ')}: similarity=${suggestion.similarity.toFixed(2)}`,
          )
        })
      } else {
        console.log(`[TEST]   No suggestions found`)
      }
    })

    await Promise.all(chunkPromises)
  }
}
