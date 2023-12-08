import { proxyActivities } from '@temporalio/workflow'

import { IMember } from '@crowd/types'
import { EnrichmentAPIMember } from '@crowd/types/premium'

import * as activities from '../activities'
import { EnrichingMember } from 'types/enrichment'

// Configure timeouts and retry policies to enrich members via third-party
// services.
const { enrichMemberUsingGitHubHandle, enrichMemberUsingEmailAddress } = proxyActivities<
  typeof activities
>({ startToCloseTimeout: '10 seconds' })

// Configure timeouts and retry policies to update member, attributes, merge
// suggestions and related organizations in the database.
const { normalizeEnrichedMember, updateMergeSuggestions, updateOrganizations } = proxyActivities<
  typeof activities
>({ startToCloseTimeout: '10 seconds' })

// Configure timeouts and retry policies to sync enriched data to OpenSearch.
const { syncMembersToOpensearch, syncOrganizationsToOpensearch } = proxyActivities<
  typeof activities
>({ startToCloseTimeout: '10 seconds' })

/*
enrichMember is a Temporal workflow that:
  - [Activity]: Fetch enriching data from a third-party provider using either the
    member's GitHub username or email address.
  - [Activity]: Normalize and update member in the database given the enriched
    data received.
  - [Activity]: Update member's merge suggestions in the database.
  - [Activity]: Update member's related organizations in the database.
  - [Activity]: Sync newly enriched member from database to OpenSearch.
  - [Activity]: Sync newly enriched organization(s) from database to OpenSearch.
*/
export async function enrichMember(input: IMember): Promise<EnrichingMember> {
  let enriched: EnrichmentAPIMember = null

  // Enrich using GitHub if possible, otherwise try with email address.
  if (input.username['github']) {
    try {
      enriched = await enrichMemberUsingGitHubHandle({
        member: input,
      })
    } catch (err) {
      throw new Error(err)
    }
  } else if (input.emails.length) {
    try {
      enriched = await enrichMemberUsingEmailAddress({
        member: input,
      })
    } catch (err) {
      throw new Error(err)
    }
  }

  // No need to continue if no data has been enriched.
  if (!enriched) {
    return {
      member: input,
      enrichment: null,
    }
  }

  try {
    await normalizeEnrichedMember({
      member: input,
      enrichment: enriched,
    })
  } catch (err) {
    throw new Error(err)
  }

  try {
    await updateMergeSuggestions({
      member: input,
      enrichment: enriched,
    })
  } catch (err) {
    throw new Error(err)
  }

  let organizations: string[]
  try {
    organizations = await updateOrganizations({
      member: input,
      enrichment: enriched,
    })
  } catch (err) {
    throw new Error(err)
  }

  try {
    await syncMembersToOpensearch([input.id])
  } catch (err) {
    throw new Error(err)
  }

  if (organizations.length > 0) {
    try {
      await syncOrganizationsToOpensearch(organizations)
    } catch (err) {
      throw new Error(err)
    }
  }

  return {
    member: input,
    enrichment: enriched,
  }
}
