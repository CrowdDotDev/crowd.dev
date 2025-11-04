import { proxyActivities } from '@temporalio/workflow'

import { IOrganizationBaseForMergeSuggestions, IOrganizationMergeSuggestion } from '@crowd/types'

import * as activities from '../activities'
import { IProcessGenerateOrganizationMergeSuggestionsArgs } from '../types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

function normalizeSuggestion(suggestion: IOrganizationMergeSuggestion): string {
  const sortedOrgs = [...suggestion.organizations].sort()
  return `${sortedOrgs[0]}:${sortedOrgs[1]}:${suggestion.similarity.toFixed(2)}`
}

function compareSuggestions(
  v1Suggestions: IOrganizationMergeSuggestion[],
  v2Suggestions: IOrganizationMergeSuggestion[],
): {
  v1Only: IOrganizationMergeSuggestion[]
  v2Only: IOrganizationMergeSuggestion[]
  common: IOrganizationMergeSuggestion[]
  similarityDiff: Array<{ orgs: string[]; v1: number; v2: number; diff: number }>
} {
  const v1Normalized = new Map<string, IOrganizationMergeSuggestion>()
  const v2Normalized = new Map<string, IOrganizationMergeSuggestion>()

  for (const s of v1Suggestions) {
    const key = normalizeSuggestion(s).split(':').slice(0, 2).join(':')
    v1Normalized.set(key, s)
  }

  for (const s of v2Suggestions) {
    const key = normalizeSuggestion(s).split(':').slice(0, 2).join(':')
    v2Normalized.set(key, s)
  }

  const v1Only: IOrganizationMergeSuggestion[] = []
  const v2Only: IOrganizationMergeSuggestion[] = []
  const common: IOrganizationMergeSuggestion[] = []
  const similarityDiff: Array<{ orgs: string[]; v1: number; v2: number; diff: number }> = []

  for (const [key, v1Suggestion] of v1Normalized.entries()) {
    const v2Suggestion = v2Normalized.get(key)
    if (v2Suggestion) {
      common.push(v1Suggestion)
      const diff = Math.abs(v1Suggestion.similarity - v2Suggestion.similarity)
      if (diff > 0.01) {
        similarityDiff.push({
          orgs: [...v1Suggestion.organizations].sort(),
          v1: v1Suggestion.similarity,
          v2: v2Suggestion.similarity,
          diff,
        })
      }
    } else {
      v1Only.push(v1Suggestion)
    }
  }

  for (const [key, v2Suggestion] of v2Normalized.entries()) {
    if (!v1Normalized.has(key)) {
      v2Only.push(v2Suggestion)
    }
  }

  return { v1Only, v2Only, common, similarityDiff }
}

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

  lastUuid = result.length > 0 ? result[result.length - 1]?.id : null

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    for (const organization of chunk) {
      const [v1Suggestions, v2Suggestions] = await Promise.all([
        activity.getOrganizationMergeSuggestions(args?.tenantId, organization),
        activity.getOrganizationMergeSuggestionsV2(args?.tenantId, organization),
      ])

      const comparison = compareSuggestions(v1Suggestions, v2Suggestions)

      // Log summary
      const hasDifferences =
        comparison.v1Only.length > 0 ||
        comparison.v2Only.length > 0 ||
        comparison.similarityDiff.length > 0

      console.log(
        `[TEST] ${organization.id} (${organization.displayName}): V1=${v1Suggestions.length}, V2=${v2Suggestions.length}, Common=${comparison.common.length}` +
          (hasDifferences
            ? ` | ⚠️ Differences: V1-only=${comparison.v1Only.length}, V2-only=${comparison.v2Only.length}, SimilarityDiffs=${comparison.similarityDiff.length}`
            : ' | ✓ Match'),
      )

      // Only log details if there are differences
      if (hasDifferences) {
        if (comparison.v1Only.length > 0) {
          console.log(`[TEST] V1-only (${comparison.v1Only.length}):`)
          comparison.v1Only.slice(0, 3).forEach((s) => {
            console.log(`[TEST] ${s.organizations.join(' <-> ')}: ${s.similarity.toFixed(2)}`)
          })
        }

        if (comparison.v2Only.length > 0) {
          console.log(`[TEST] V2-only (${comparison.v2Only.length}):`)
          comparison.v2Only.slice(0, 3).forEach((s) => {
            console.log(`[TEST] ${s.organizations.join(' <-> ')}: ${s.similarity.toFixed(2)}`)
          })
        }

        if (comparison.similarityDiff.length > 0) {
          console.log(`[TEST] Similarity differences (${comparison.similarityDiff.length}):`)
          comparison.similarityDiff.slice(0, 3).forEach((diff) => {
            console.log(
              `[TEST] ${diff.orgs.join(' <-> ')}: V1=${diff.v1.toFixed(2)}, V2=${diff.v2.toFixed(2)}, diff=${diff.diff.toFixed(2)}`,
            )
          })
        }
      }
    }
  }
}
