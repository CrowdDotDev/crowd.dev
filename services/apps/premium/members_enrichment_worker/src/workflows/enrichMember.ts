import { proxyActivities } from '@temporalio/workflow'

import { IMember, MemberIdentityType, PlatformType } from '@crowd/types'
import { EnrichmentAPIMember } from '@crowd/types/src/premium'

import * as activities from '../activities'
import { EnrichingMember } from '../types/enrichment'
import { ALSO_USE_EMAIL_IDENTITIES_FOR_ENRICHMENT } from '../utils/config'

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

  // Enrich using GitHub if possible.
  const githubUsernames = input.identities.filter(
    (i) =>
      i.verified && i.platform === PlatformType.GITHUB && i.type === MemberIdentityType.USERNAME,
  )

  if (githubUsernames.length > 0) {
    try {
      enriched = await enrichMemberUsingGitHubHandle(githubUsernames[0].value)
    } catch (err) {
      throw new Error(err)
    }
  }

  if (ALSO_USE_EMAIL_IDENTITIES_FOR_ENRICHMENT) {
    // Otherwise try with email address.
    const emails = input.identities.filter((i) => i.verified && i.type === MemberIdentityType.EMAIL)
    if (!enriched && emails.length) {
      try {
        enriched = await enrichMemberUsingEmailAddress(emails[0].value)
      } catch (err) {
        throw new Error(err)
      }
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
    await syncMembersToOpensearch(input.id)
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
