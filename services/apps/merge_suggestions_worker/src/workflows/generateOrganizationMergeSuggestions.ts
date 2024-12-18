import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import {
  IOrganizationBaseForMergeSuggestions,
  IOrganizationMergeSuggestion,
  OrganizationMergeSuggestionTable,
} from '@crowd/types'

import * as activities from '../activities/organizationMergeSuggestions'
import { IProcessGenerateOrganizationMergeSuggestionsArgs } from '../types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateOrganizationMergeSuggestions(
  args: IProcessGenerateOrganizationMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 25
  const PARALLEL_SUGGESTION_PROCESSING = 50
  const SIMILARITY_CONFIDENCE_SCORE_THRESHOLD = 0.5

  let lastUuid: string = args.lastUuid || null

  // get the latest generation time of tenant's organization suggestions, we'll only get organizations created after that for new suggestions
  const lastGeneratedAt = await activity.findTenantsLatestOrganizationSuggestionGeneratedAt(
    args.tenantId,
  )

  const result: IOrganizationBaseForMergeSuggestions[] = await activity.getOrganizations(
    args.tenantId,
    PAGE_SIZE,
    lastUuid,
    lastGeneratedAt,
    args.organizationIds,
  )

  if (result.length === 0) {
    await activity.updateOrganizationMergeSuggestionsLastGeneratedAt(args.tenantId)
    return
  }

  lastUuid = result.length > 0 ? result[result.length - 1]?.id : null

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
    await activity.addOrganizationToMerge(
      allMergeSuggestions,
      OrganizationMergeSuggestionTable.ORGANIZATION_TO_MERGE_RAW,
    )

    await activity.addOrganizationToMerge(
      allMergeSuggestions.filter((s) => s.similarity > SIMILARITY_CONFIDENCE_SCORE_THRESHOLD),
      OrganizationMergeSuggestionTable.ORGANIZATION_TO_MERGE_FILTERED,
    )
  }

  await continueAsNew<typeof generateOrganizationMergeSuggestions>({
    tenantId: args.tenantId,
    lastUuid,
    organizationIds: args.organizationIds
      ? args.organizationIds.filter(
          (organizationId) => !result.map((r) => r.id).includes(organizationId),
        )
      : undefined,
  })
}
