import { proxyActivities, continueAsNew } from '@temporalio/workflow'
import * as activities from '../activities/organizationMergeSuggestions'

import {
  IOrganizationMergeSuggestion,
  IProcessGenerateMemberMergeSuggestionsArgs,
} from '@crowd/types'
import { IOrganizationPartialAggregatesOpensearch } from '../types'
import { chunkArray } from '../utils'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function generateOrganizationMergeSuggestions(
  args: IProcessGenerateMemberMergeSuggestionsArgs,
): Promise<void> {
  const PAGE_SIZE = 500
  const PARALLEL_SUGGESTION_PROCESSING = 250

  let lastUuid: string = args.lastUuid || null

  // get the latest generation time of tenant's member suggestions, we'll only get members created after that for new suggestions
  const lastGeneratedAt = await activity.findTenantsLatestOrganizationSuggestionGeneratedAt(
    args.tenantId,
  )

  const result: IOrganizationPartialAggregatesOpensearch[] = await activity.getOrganizations(
    args.tenantId,
    PAGE_SIZE,
    lastUuid,
    lastGeneratedAt,
  )

  if (result.length === 0) {
    await activity.updateOrganizationMergeSuggestionsLastGeneratedAt(args.tenantId)
    return
  }

  lastUuid = result.length > 0 ? result[result.length - 1]?.uuid_organizationId : null

  const allMergeSuggestions: IOrganizationMergeSuggestion[] = []

  const promiseChunks = chunkArray(result, PARALLEL_SUGGESTION_PROCESSING)

  for (const chunk of promiseChunks) {
    const mergeSuggestionsPromises: Promise<IOrganizationMergeSuggestion[]>[] = chunk.map(
      (organization) => activity.getOrganizationMergeSuggestions(args.tenantId, organization),
    )

    const mergeSuggestionsResults: IOrganizationMergeSuggestion[][] = await Promise.all(
      mergeSuggestionsPromises,
    )
    allMergeSuggestions.push(...mergeSuggestionsResults.flat())
  }

  // Add all merge suggestions to add to merge
  if (allMergeSuggestions.length > 0) {
    await activity.addOrganizationToMerge(allMergeSuggestions)
  }

  await continueAsNew<typeof generateOrganizationMergeSuggestions>({
    tenantId: args.tenantId,
    lastUuid,
  })
}
