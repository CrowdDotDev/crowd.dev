import {
  IOrganizationBaseForMergeSuggestions,
  IOrganizationForMergeSuggestionsOpensearch,
  IOrganizationFullAggregatesOpensearch,
  IOrganizationMergeSuggestion,
  OpenSearchIndex,
  OrganizationIdentityType,
  OrganizationMergeSuggestionTable,
} from '@crowd/types'
import { svc } from '../main'

import { ISimilarOrganizationOpensearch } from '../types'
import OrganizationMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/organizationMergeSuggestions.repo'
import { hasLfxMembership } from '@crowd/data-access-layer/src/lfx_memberships'
import { prefixLength } from '../utils'
import OrganizationSimilarityCalculator from '../organizationSimilarityCalculator'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { queryOrgs, OrganizationField } from '@crowd/data-access-layer/src/orgs'
import { buildFullOrgForMergeSuggestions } from '@crowd/opensearch'

export async function getOrganizations(
  tenantId: string,
  batchSize: number,
  afterOrganizationId?: string,
  lastGeneratedAt?: string,
): Promise<IOrganizationBaseForMergeSuggestions[]> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())
    const rows = await queryOrgs(qx, {
      filter: {
        and: [
          { [OrganizationField.TENANT_ID]: { eq: tenantId } },
          afterOrganizationId ? { [OrganizationField.ID]: { gt: afterOrganizationId } } : null,
          lastGeneratedAt ? { [OrganizationField.CREATED_AT]: { gt: lastGeneratedAt } } : null,
        ],
      },
      fields: [
        OrganizationField.ID,
        OrganizationField.TENANT_ID,
        OrganizationField.DISPLAY_NAME,
        OrganizationField.LOCATION,
        OrganizationField.INDUSTRY,
      ],
      limit: batchSize,
    })

    return rows
  } catch (err) {
    throw new Error(err)
  }
}

export async function findTenantsLatestOrganizationSuggestionGeneratedAt(
  tenantId: string,
): Promise<string> {
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  return organizationMergeSuggestionsRepo.findTenantsLatestOrganizationSuggestionGeneratedAt(
    tenantId,
  )
}

export async function updateOrganizationMergeSuggestionsLastGeneratedAt(
  tenantId: string,
): Promise<void> {
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  await organizationMergeSuggestionsRepo.updateOrganizationMergeSuggestionsLastGeneratedAt(tenantId)
}

export async function getOrganizationMergeSuggestions(
  tenantId: string,
  organization: IOrganizationBaseForMergeSuggestions,
): Promise<IOrganizationMergeSuggestion[]> {
  function opensearchToFullOrg(
    organization: IOrganizationForMergeSuggestionsOpensearch,
  ): IOrganizationFullAggregatesOpensearch {
    return {
      id: organization.uuid_organizationId,
      tenantId: organization.uuid_tenantId,
      displayName: organization.keyword_displayName,
      location: organization.string_location,
      industry: organization.string_industry,
      ticker: organization.string_ticker,
      identities: organization.nested_identities.map((identity) => ({
        platform: identity.string_platform,
        type: identity.string_type as OrganizationIdentityType,
        value: identity.string_value,
        verified: identity.bool_verified,
      })),
      website: organization.string_website,
      activityCount: organization.int_activityCount,
      noMergeIds: [],
    }
  }

  const mergeSuggestions: IOrganizationMergeSuggestion[] = []
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )

  const qx = pgpQx(svc.postgres.reader.connection())
  const fullOrg = await buildFullOrgForMergeSuggestions(qx, organization)

  if (fullOrg.identities.length === 0) {
    return []
  }

  const identitiesShould = []
  const identitiesPartialQuery = {
    should: [
      {
        term: {
          [`keyword_displayName`]: fullOrg.displayName,
        },
      },
      {
        nested: {
          path: 'nested_identities',
          query: {
            bool: {
              should: identitiesShould,
              minimum_should_match: 1,
            },
          },
        },
      },
    ],
    minimum_should_match: 1,
    must_not: [
      {
        term: {
          uuid_organizationId: fullOrg.id,
        },
      },
    ],
    must: [
      {
        term: {
          uuid_tenantId: tenantId,
        },
      },
    ],
  }
  let hasFuzzySearch = false

  for (const identity of fullOrg.identities) {
    if (identity.value.length > 0) {
      // weak identity search
      identitiesShould.push({
        bool: {
          must: [
            { match: { [`nested_identities.string_value`]: identity.value } },
            { match: { [`nested_identities.string_platform`]: identity.platform } },
            { term: { [`nested_identities.bool_verified`]: false } },
          ],
        },
      })

      // some identities have https? in the beginning, resulting in false positive suggestions
      // remove these when making fuzzy, wildcard and prefix searches
      const cleanedIdentityName = identity.value.replace(/^https?:\/\//, '')

      // only do fuzzy/wildcard/partial search when identity name is not all numbers (like linkedin organization profiles)
      if (Number.isNaN(Number(identity.value))) {
        hasFuzzySearch = true
        // fuzzy search for identities
        identitiesShould.push({
          bool: {
            must: [
              {
                match: {
                  [`nested_identities.string_value`]: {
                    query: cleanedIdentityName,
                    prefix_length: 1,
                    fuzziness: 'auto',
                  },
                },
              },
              { term: { [`nested_identities.bool_verified`]: true } },
            ],
          },
        })

        // also check for prefix for identities that has more than 5 characters and no whitespace
        if (identity.value.length > 5 && identity.value.indexOf(' ') === -1) {
          identitiesShould.push({
            bool: {
              must: [
                {
                  prefix: {
                    [`nested_identities.string_value`]: {
                      value: cleanedIdentityName.slice(0, prefixLength(cleanedIdentityName)),
                    },
                  },
                },
                { term: { [`nested_identities.bool_verified`]: true } },
              ],
            },
          })
        }
      }
    }
  }

  // check if we have any actual identity searches, if not remove it from the query
  if (!hasFuzzySearch) {
    identitiesPartialQuery.should.pop()
  }

  const noMergeIds = await organizationMergeSuggestionsRepo.findNoMergeIds(fullOrg.id)

  if (noMergeIds && noMergeIds.length > 0) {
    for (const noMergeId of noMergeIds) {
      identitiesPartialQuery.must_not.push({
        term: {
          uuid_organizationId: noMergeId,
        },
      })
    }
  }

  const similarOrganizationsQueryBody = {
    query: {
      bool: identitiesPartialQuery,
    },
    collapse: {
      field: 'uuid_organizationId',
    },
    _source: [
      'uuid_organizationId',
      'uuid_tenantId',
      'nested_identities',
      'nested_weakIdentities',
      'keyword_displayName',
      'string_location',
      'string_industry',
      'string_website',
      'string_ticker',
      'int_activityCount',
    ],
  }

  const primaryOrgWithLfxMembership = await hasLfxMembership(qx, {
    tenantId,
    organizationId: fullOrg.id,
  })

  let organizationsToMerge: ISimilarOrganizationOpensearch[]

  try {
    organizationsToMerge =
      (
        await svc.opensearch.client.search({
          index: OpenSearchIndex.ORGANIZATIONS,
          body: similarOrganizationsQueryBody,
        })
      ).body?.hits?.hits || []
  } catch (e) {
    svc.log.info(
      { error: e, query: identitiesPartialQuery },
      'Error while searching for similar organizations!',
    )
    throw e
  }

  for (const organizationToMerge of organizationsToMerge) {
    const secondaryOrgWithLfxMembership = await hasLfxMembership(qx, {
      tenantId,
      organizationId: organizationToMerge._source.uuid_organizationId,
    })

    if (primaryOrgWithLfxMembership && secondaryOrgWithLfxMembership) {
      continue
    }

    const similarityConfidenceScore = OrganizationSimilarityCalculator.calculateSimilarity(
      fullOrg,
      opensearchToFullOrg(organizationToMerge._source),
    )

    const organizationsSorted = [fullOrg, opensearchToFullOrg(organizationToMerge._source)].sort(
      (a, b) => {
        if (
          a.identities.length > b.identities.length ||
          (a.identities.length === b.identities.length && a.activityCount > b.activityCount)
        ) {
          return -1
        } else if (
          a.identities.length < b.identities.length ||
          (a.identities.length === b.identities.length && a.activityCount < b.activityCount)
        ) {
          return 1
        }
        return 0
      },
    )

    mergeSuggestions.push({
      similarity: similarityConfidenceScore,
      organizations: [organizationsSorted[0].id, organizationsSorted[1].id],
    })
  }

  return mergeSuggestions
}

export async function addOrganizationToMerge(
  suggestions: IOrganizationMergeSuggestion[],
  table: OrganizationMergeSuggestionTable,
): Promise<void> {
  if (suggestions.length > 0) {
    const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
      svc.postgres.writer.connection(),
      svc.log,
    )
    await organizationMergeSuggestionsRepo.addToMerge(suggestions, table)
  }
}
