import { IOrganizationMergeSuggestion, OpenSearchIndex } from '@crowd/types'
import { svc } from '../main'

import {
  IOrganizationPartialAggregatesOpensearch,
  IOrganizationPartialAggregatesOpensearchRawResult,
  IOrganizationQueryBody,
  ISimilarOrganizationOpensearch,
} from '../types'
import OrganizationMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/organizationMergeSuggestions.repo'
import { prefixLength } from '../utils'
import OrganizationSimilarityCalculator from '../organizationSimilarityCalculator'

export async function getOrganizations(
  tenantId: string,
  batchSize: number,
  afterOrganizationId?: string,
  lastGeneratedAt?: string,
): Promise<IOrganizationPartialAggregatesOpensearch[]> {
  try {
    const queryBody: IOrganizationQueryBody = {
      from: 0,
      size: batchSize,
      query: {
        bool: {
          filter: [
            {
              term: {
                uuid_tenantId: tenantId,
              },
            },
          ],
        },
      },
      sort: {
        [`uuid_organizationId`]: 'asc',
      },
      collapse: {
        field: 'uuid_organizationId',
      },
      _source: [
        'uuid_organizationId',
        'nested_identities',
        'uuid_arr_noMergeIds',
        'keyword_displayName',
        'string_location',
        'string_industry',
        'string_website',
        'string_ticker',
      ],
    }

    if (afterOrganizationId) {
      queryBody.query.bool.filter.push({
        range: {
          uuid_organizationId: {
            gt: afterOrganizationId,
          },
        },
      })
    }

    if (lastGeneratedAt) {
      queryBody.query.bool.filter.push({
        range: {
          date_createdAt: {
            gt: new Date(lastGeneratedAt).toISOString(),
          },
        },
      })
    }

    const organizations: IOrganizationPartialAggregatesOpensearchRawResult[] =
      (
        await svc.opensearch.client.search({
          index: OpenSearchIndex.ORGANIZATIONS,
          body: queryBody,
        })
      ).body?.hits?.hits || []

    return organizations.map((organization) => organization._source)
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
  organization: IOrganizationPartialAggregatesOpensearch,
): Promise<IOrganizationMergeSuggestion[]> {
  const SIMILARITY_CONFIDENCE_SCORE_THRESHOLD = 0.5
  const mergeSuggestions: IOrganizationMergeSuggestion[] = []
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )

  if (organization.nested_identities.length === 0) {
    return []
  }

  const identitiesPartialQuery = {
    should: [
      {
        term: {
          [`keyword_displayName`]: organization.keyword_displayName,
        },
      },
      {
        nested: {
          path: 'nested_weakIdentities',
          query: {
            bool: {
              should: [],
              boost: 1000,
              minimum_should_match: 1,
            },
          },
        },
      },
      {
        nested: {
          path: 'nested_identities',
          query: {
            bool: {
              should: [],
              boost: 1,
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
          uuid_organizationId: organization.uuid_organizationId,
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

  for (const identity of organization.nested_identities) {
    if (identity.string_name.length > 0) {
      // weak identity search
      identitiesPartialQuery.should[1].nested.query.bool.should.push({
        bool: {
          must: [
            { match: { [`nested_weakIdentities.keyword_name`]: identity.string_name } },
            {
              match: {
                [`nested_weakIdentities.string_platform`]: identity.string_platform,
              },
            },
          ],
        },
      })

      // some identities have https? in the beginning, resulting in false positive suggestions
      // remove these when making fuzzy, wildcard and prefix searches
      const cleanedIdentityName = identity.string_name.replace(/^https?:\/\//, '')

      // only do fuzzy/wildcard/partial search when identity name is not all numbers (like linkedin organization profiles)
      if (Number.isNaN(Number(identity.string_name))) {
        hasFuzzySearch = true
        // fuzzy search for identities
        identitiesPartialQuery.should[2].nested.query.bool.should.push({
          match: {
            [`nested_identities.keyword_name`]: {
              query: cleanedIdentityName,
              prefix_length: 1,
              fuzziness: 'auto',
            },
          },
        })

        // also check for prefix for identities that has more than 5 characters and no whitespace
        if (identity.string_name.length > 5 && identity.string_name.indexOf(' ') === -1) {
          identitiesPartialQuery.should[2].nested.query.bool.should.push({
            prefix: {
              [`nested_identities.keyword_name`]: {
                value: cleanedIdentityName.slice(0, prefixLength(cleanedIdentityName)),
              },
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

  const noMergeIds = await organizationMergeSuggestionsRepo.findNoMergeIds(
    organization.uuid_organizationId,
  )

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
      'nested_identities',
      'nested_weakIdentities',
      'keyword_displayName',
      'string_location',
      'string_industry',
      'string_website',
      'string_ticker',
    ],
  }

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
    const similarityConfidenceScore = OrganizationSimilarityCalculator.calculateSimilarity(
      organization,
      organizationToMerge._source,
    )
    if (similarityConfidenceScore > SIMILARITY_CONFIDENCE_SCORE_THRESHOLD) {
      mergeSuggestions.push({
        similarity: similarityConfidenceScore,
        organizations: [
          organization.uuid_organizationId,
          organizationToMerge._source.uuid_organizationId,
        ],
      })
    }
  }

  return mergeSuggestions
}

export async function addOrganizationToMerge(
  suggestions: IOrganizationMergeSuggestion[],
): Promise<void> {
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  await organizationMergeSuggestionsRepo.addToMerge(suggestions)
}
