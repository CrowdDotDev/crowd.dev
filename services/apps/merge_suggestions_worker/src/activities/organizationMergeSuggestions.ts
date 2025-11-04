import uniqBy from 'lodash.uniqby'

import { OrganizationField, findOrgById, queryOrgs } from '@crowd/data-access-layer'
import { hasLfxMembership } from '@crowd/data-access-layer/src/lfx_memberships'
import OrganizationMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/organizationMergeSuggestions.repo'
import { addOrgNoMerge } from '@crowd/data-access-layer/src/org_merge'
import { fetchOrgIdentities, findOrgAttributes } from '@crowd/data-access-layer/src/organizations'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { buildFullOrgForMergeSuggestions } from '@crowd/opensearch'
import {
  ILLMConsumableOrganization,
  IOrganizationBaseForMergeSuggestions,
  IOrganizationFullAggregatesOpensearch,
  IOrganizationMergeSuggestion,
  IOrganizationOpensearch,
  OpenSearchIndex,
  OrganizationIdentityType,
  OrganizationMergeSuggestionTable,
} from '@crowd/types'

import { svc } from '../main'
import OrganizationSimilarityCalculator from '../organizationSimilarityCalculator'
import { ISimilarOrganizationOpensearchResult, ISimilarityFilter } from '../types'
import { prefixLength } from '../utils'

export async function getOrganizations(
  tenantId: string,
  batchSize: number,
  afterOrganizationId?: string,
  lastGeneratedAt?: string,
  organizationIds?: string[],
): Promise<IOrganizationBaseForMergeSuggestions[]> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())
    const rows = await queryOrgs(qx, {
      filter: {
        and: [
          { [OrganizationField.TENANT_ID]: { eq: tenantId } },
          afterOrganizationId ? { [OrganizationField.ID]: { gt: afterOrganizationId } } : null,
          // Include organizations updated after the last generation to cover both new and modified ones
          lastGeneratedAt ? { [OrganizationField.UPDATED_AT]: { gt: lastGeneratedAt } } : null,
          organizationIds ? { [OrganizationField.ID]: { in: organizationIds } } : null,
          // TODO filter by organizationIds,
        ],
      },
      fields: [
        OrganizationField.ID,
        OrganizationField.TENANT_ID,
        OrganizationField.DISPLAY_NAME,
        OrganizationField.LOCATION,
        OrganizationField.INDUSTRY,
      ],
      orderBy: `${OrganizationField.ID} asc`,
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
  svc.log.debug(`Getting merge suggestions for ${organization.id}!`)

  function opensearchToFullOrg(
    organization: IOrganizationOpensearch,
  ): IOrganizationFullAggregatesOpensearch {
    return {
      id: organization.uuid_organizationId,
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

  const noMergeIds = await organizationMergeSuggestionsRepo.findNoMergeIds(fullOrg.id)
  const excludeIds = [fullOrg.id]

  if (noMergeIds && noMergeIds.length > 0) {
    excludeIds.push(...noMergeIds)
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
        terms: {
          uuid_organizationId: excludeIds,
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

  // deduplicate identities, sort verified first
  const identities = uniqBy(fullOrg.identities, (i) => `${i.platform}:${i.value}`).sort((a, b) =>
    a.verified === b.verified ? 0 : a.verified ? -1 : 1,
  )

  // limit to prevent exceeding OpenSearch maxClauseCount (1024)
  for (const identity of identities.slice(0, 60)) {
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
      let cleanedIdentityName = identity.value.replace(/^https?:\/\//, '')

      // linkedin identities now have prefixes in them, like `school:` or `company:`
      // we should remove these prefixes when searching for similar identities
      if (identity.platform === 'linkedin') {
        cleanedIdentityName = cleanedIdentityName.split(':').pop()
      }

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

  const similarOrganizationsQueryBody = {
    query: {
      bool: identitiesPartialQuery,
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
    organizationId: fullOrg.id,
  })

  let organizationsToMerge: ISimilarOrganizationOpensearchResult[]

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

export async function getOrganizationMergeSuggestionsV2(
  tenantId: string,
  organization: IOrganizationBaseForMergeSuggestions,
): Promise<IOrganizationMergeSuggestion[]> {
  svc.log.info(
    `[V2] Getting merge suggestions for organization ${organization.id} (${organization.displayName})`,
  )

  function opensearchToFullOrg(
    organization: IOrganizationOpensearch,
  ): IOrganizationFullAggregatesOpensearch {
    return {
      id: organization.uuid_organizationId,
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

  svc.log.info(
    `[V2] Loaded organization ${fullOrg.id} with ${fullOrg.identities.length} identities`,
  )

  if (fullOrg.identities.length === 0) {
    svc.log.info(`[V2] No identities found, returning empty suggestions`)
    return []
  }

  const noMergeIds = await organizationMergeSuggestionsRepo.findNoMergeIds(fullOrg.id)
  const excludeIds = [fullOrg.id]

  if (noMergeIds && noMergeIds.length > 0) {
    excludeIds.push(...noMergeIds)
  }

  svc.log.info(`[V2] Excluding ${excludeIds.length} organization IDs from search`)

  // deduplicate identities, sort verified first
  const identities = uniqBy(fullOrg.identities, (i) => `${i.platform}:${i.value}`).sort((a, b) =>
    a.verified === b.verified ? 0 : a.verified ? -1 : 1,
  )

  svc.log.info(
    `[V2] Processed ${identities.length} unique identities (${identities.filter((i) => i.verified).length} verified, ${identities.filter((i) => !i.verified).length} unverified)`,
  )

  // Group identities by platform for optimized query building
  // Weak identity search: ALL identities (verified + unverified) → searches in OTHER unverified identities
  // Fuzzy/Prefix search: ALL identities (verified + unverified) → searches in OTHER verified identities
  // Note: The filter bool_verified:true means searching IN OTHER verified, not filtering OUR identities
  const weakIdentitiesByPlatform = new Map<string, string[]>()
  const identitiesForFuzzy: Array<{ value: string; cleanedValue: string }> = []
  const identitiesForPrefix: Array<{
    value: string
    cleanedValue: string
    prefix: string
  }> = []

  // Process ALL identities for query building (limit to 100)
  // Original logic: uses ALL identities for all searches, regardless of verified status
  const identitiesToProcess = identities.slice(0, 100)
  svc.log.info(
    `[V2] Processing ${identitiesToProcess.length} identities for query building (out of ${identities.length} total)`,
  )

  for (const identity of identitiesToProcess) {
    if (identity.value.length > 0) {
      // Group weak identities by platform (ALL identities: verified + unverified)
      // Weak identity search: searches for our identities in OTHER organizations' unverified identities
      if (!weakIdentitiesByPlatform.has(identity.platform)) {
        weakIdentitiesByPlatform.set(identity.platform, [])
      }
      const platformIdentities = weakIdentitiesByPlatform.get(identity.platform)
      if (platformIdentities) {
        platformIdentities.push(identity.value)
      }

      // Prepare cleaned identity name for fuzzy/prefix searches (ALL identities: verified + unverified)
      // Fuzzy/Prefix searches: searches for our identities in OTHER organizations' verified identities
      let cleanedIdentityName = identity.value.replace(/^https?:\/\//, '')

      if (identity.platform === 'linkedin') {
        cleanedIdentityName = cleanedIdentityName.split(':').pop() || cleanedIdentityName
      }

      // Only do fuzzy/wildcard/partial search when identity name is not all numbers
      if (Number.isNaN(Number(identity.value))) {
        identitiesForFuzzy.push({
          value: identity.value,
          cleanedValue: cleanedIdentityName,
        })

        // Also check for prefix for identities that has more than 5 characters and no whitespace
        if (identity.value.length > 5 && identity.value.indexOf(' ') === -1) {
          identitiesForPrefix.push({
            value: identity.value,
            cleanedValue: cleanedIdentityName,
            prefix: cleanedIdentityName.slice(0, prefixLength(cleanedIdentityName)),
          })
        }
      }
    }
  }

  svc.log.info(`[V2] Grouped identities:
    - Weak identities by platform: ${weakIdentitiesByPlatform.size} platforms
    - Identities for fuzzy: ${identitiesForFuzzy.length}
    - Identities for prefix: ${identitiesForPrefix.length}`)

  // Log platform breakdown
  for (const [platform, values] of weakIdentitiesByPlatform.entries()) {
    svc.log.info(`[V2]   Platform "${platform}": ${values.length} weak identities`)
  }

  // Build optimized query structure
  const identitiesShould = []
  const CHUNK_SIZE = 20 // Chunk identities to avoid clause explosion

  // 1. Weak identity searches grouped by platform using match queries (chunked)
  // Note: Using match instead of terms because organizations use string_value (analyzed text), not keyword_value
  for (const [platform, values] of weakIdentitiesByPlatform.entries()) {
    if (values.length > 0) {
      // Chunk values to avoid exceeding clause limits
      for (let i = 0; i < values.length; i += CHUNK_SIZE) {
        const chunkedValues = values.slice(i, i + CHUNK_SIZE)
        const matchShouldClauses = chunkedValues.map((value) => ({
          match: {
            [`nested_identities.string_value`]: {
              query: value,
              operator: 'and', // Require exact match (all terms must match)
            },
          },
        }))

        identitiesShould.push({
          bool: {
            must: [
              {
                term: {
                  [`nested_identities.string_platform`]: platform,
                },
              },
            ],
            should: matchShouldClauses,
            minimum_should_match: 1,
            filter: [
              {
                term: {
                  [`nested_identities.bool_verified`]: false,
                },
              },
            ],
          },
        })
      }
    }
  }

  svc.log.info(
    `[V2] Created ${identitiesShould.length} weak identity queries (grouped by platform, chunked)`,
  )

  // 2. Combined fuzzy searches (deduplicate cleaned values, chunked)
  // prefix_length limits fuzzy expansion by requiring exact prefix match
  if (identitiesForFuzzy.length > 0) {
    const uniqueFuzzyValues = [
      ...new Set(identitiesForFuzzy.map(({ cleanedValue }) => cleanedValue)),
    ]
    // Chunk fuzzy values to avoid exceeding clause limits
    const fuzzyChunks: string[][] = []
    for (let i = 0; i < uniqueFuzzyValues.length; i += CHUNK_SIZE) {
      fuzzyChunks.push(uniqueFuzzyValues.slice(i, i + CHUNK_SIZE))
    }

    for (const chunk of fuzzyChunks) {
      const fuzzyShouldClauses = chunk.map((cleanedValue) => ({
        match: {
          [`nested_identities.string_value`]: {
            query: cleanedValue,
            prefix_length: cleanedValue.length > 10 ? 3 : 1, // Longer strings require more prefix match (reduces expansion)
            fuzziness: 'auto',
            // Note: prefix_length naturally limits fuzzy expansion by requiring exact prefix match
          },
        },
      }))

      identitiesShould.push({
        bool: {
          should: fuzzyShouldClauses,
          minimum_should_match: 1,
          filter: [
            {
              term: {
                [`nested_identities.bool_verified`]: true,
              },
            },
          ],
        },
      })
    }

    svc.log.info(
      `[V2] Created ${fuzzyChunks.length} combined fuzzy search queries (${uniqueFuzzyValues.length} unique values, deduplicated from ${identitiesForFuzzy.length} identities)`,
    )
  }

  // 3. Combined prefix searches (deduplicate prefixes)
  if (identitiesForPrefix.length > 0) {
    const uniquePrefixes = [...new Set(identitiesForPrefix.map(({ prefix }) => prefix))]
    // Chunk prefixes to avoid exceeding clause limits
    const prefixChunks: string[][] = []
    for (let i = 0; i < uniquePrefixes.length; i += CHUNK_SIZE) {
      prefixChunks.push(uniquePrefixes.slice(i, i + CHUNK_SIZE))
    }

    for (const chunk of prefixChunks) {
      const prefixShouldClauses = chunk.map((prefix) => ({
        prefix: {
          [`nested_identities.string_value`]: {
            value: prefix,
          },
        },
      }))

      identitiesShould.push({
        bool: {
          should: prefixShouldClauses,
          minimum_should_match: 1,
          filter: [
            {
              term: {
                [`nested_identities.bool_verified`]: true,
              },
            },
          ],
        },
      })
    }

    svc.log.info(
      `[V2] Created ${prefixChunks.length} combined prefix search queries (${uniquePrefixes.length} unique prefixes, deduplicated from ${identitiesForPrefix.length} identities)`,
    )
  }

  svc.log.info(`[V2] Total identity queries in nested should: ${identitiesShould.length}`)

  // Build the main query structure
  const identitiesPartialQuery = {
    should: [
      {
        term: {
          [`keyword_displayName`]: fullOrg.displayName,
        },
      },
      ...(identitiesShould.length > 0
        ? [
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
          ]
        : []),
    ],
    minimum_should_match: 1,
    must_not: [
      {
        terms: {
          uuid_organizationId: excludeIds,
        },
      },
    ],
    filter: [
      {
        term: {
          uuid_tenantId: tenantId,
        },
      },
    ],
  }

  // Estimate clause count (rough approximation)
  // With chunking (CHUNK_SIZE=20) and prefix_length on fuzzy queries,
  // we stay well under the 1024 clause limit
  let estimatedClauseCount = 1 // displayName term
  estimatedClauseCount += identitiesShould.length // top-level identity query structures
  // Each chunked query has at most CHUNK_SIZE should clauses
  // prefix_length on fuzzy queries naturally limits expansion by requiring exact prefix match
  estimatedClauseCount += excludeIds.length // must_not terms
  estimatedClauseCount += 1 // tenantId filter
  // Note: Actual clause count is lower due to chunking and prefix_length limiting fuzzy expansion

  svc.log.info(
    `[V2] Estimated clause count: ~${estimatedClauseCount} (limit: 1024, chunked with prefix_length limiting fuzzy expansion)`,
  )

  const similarOrganizationsQueryBody = {
    query: {
      bool: identitiesPartialQuery,
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

  svc.log.info(`[V2] Query structure:`, JSON.stringify(similarOrganizationsQueryBody, null, 2))

  const primaryOrgWithLfxMembership = await hasLfxMembership(qx, {
    organizationId: fullOrg.id,
  })

  svc.log.info(`[V2] Primary organization LFX membership: ${primaryOrgWithLfxMembership}`)

  let organizationsToMerge: ISimilarOrganizationOpensearchResult[]

  try {
    svc.log.info(`[V2] Executing OpenSearch query...`)
    const searchStartTime = Date.now()
    organizationsToMerge =
      (
        await svc.opensearch.client.search({
          index: OpenSearchIndex.ORGANIZATIONS,
          body: similarOrganizationsQueryBody,
        })
      ).body?.hits?.hits || []
    const searchDuration = Date.now() - searchStartTime

    svc.log.info(
      `[V2] OpenSearch query completed in ${searchDuration}ms, found ${organizationsToMerge.length} potential matches`,
    )
  } catch (e) {
    svc.log.error(
      { error: e, query: identitiesPartialQuery },
      '[V2] Error while searching for similar organizations!',
    )
    throw e
  }

  svc.log.info(
    `[V2] Processing ${organizationsToMerge.length} potential matches for similarity calculation`,
  )

  for (const organizationToMerge of organizationsToMerge) {
    const secondaryOrgWithLfxMembership = await hasLfxMembership(qx, {
      organizationId: organizationToMerge._source.uuid_organizationId,
    })

    if (primaryOrgWithLfxMembership && secondaryOrgWithLfxMembership) {
      svc.log.debug(
        `[V2] Skipping ${organizationToMerge._source.uuid_organizationId} - both organizations are LFX members`,
      )
      continue
    }

    const similarityConfidenceScore = OrganizationSimilarityCalculator.calculateSimilarity(
      fullOrg,
      opensearchToFullOrg(organizationToMerge._source),
    )

    svc.log.info(
      `[V2] Similarity score ${similarityConfidenceScore} for organization ${organizationToMerge._source.uuid_organizationId} (${organizationToMerge._source.keyword_displayName})`,
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

  svc.log.info(
    `[V2] Completed processing. Generated ${mergeSuggestions.length} merge suggestions for organization ${organization.id}`,
  )

  // Log summary of merge suggestions with IDs and similarity scores
  if (mergeSuggestions.length > 0) {
    svc.log.info(
      `[V2] Merge suggestions summary for ${organization.id} (${organization.displayName}):`,
    )
    mergeSuggestions
      .sort((a, b) => b.similarity - a.similarity)
      .forEach((suggestion, index) => {
        svc.log.info(
          `[V2]   ${index + 1}. Similarity: ${suggestion.similarity}, Organizations: [${suggestion.organizations[0]}, ${suggestion.organizations[1]}]`,
        )
      })
  } else {
    svc.log.info(`[V2] No merge suggestions generated for ${organization.id}`)
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

async function prepareOrg(
  qx: QueryExecutor,
  organizationId: string,
): Promise<ILLMConsumableOrganization> {
  const [base, identities, attributes] = await Promise.all([
    findOrgById(qx, organizationId, [
      OrganizationField.ID,
      OrganizationField.DISPLAY_NAME,
      OrganizationField.DESCRIPTION,
      OrganizationField.LOGO,
      OrganizationField.TAGS,
      OrganizationField.LOCATION,
      OrganizationField.TYPE,
      OrganizationField.HEADLINE,
      OrganizationField.INDUSTRY,
      OrganizationField.FOUNDED,
    ]),
    fetchOrgIdentities(qx, organizationId),
    findOrgAttributes(qx, organizationId),
  ])

  if (!base) {
    return null
  }

  return {
    displayName: base?.displayName || '',
    description: base.description,
    phoneNumbers: attributes.filter((a) => a.name === 'phoneNumber').map((a) => a.value),
    logo: base.logo,
    tags: base.tags,
    location: base.location,
    type: base.type,
    geoLocation: attributes.find((a) => a.name === 'geoLocation')?.value || '',
    ticker: attributes.find((a) => a.name === 'ticker')?.value || '',
    profiles: attributes.filter((a) => a.name === 'profile').map((a) => a.value),
    headline: base.headline,
    industry: base.industry,
    founded: base.founded,
    alternativeNames: attributes.filter((a) => a.name === 'alternativeName').map((a) => a.value),
    identities: identities.map((i) => ({
      platform: i.platform,
      value: i.value,
    })),
  }
}

export async function getOrganizationsForLLMConsumption(
  organizationIds: string[],
): Promise<ILLMConsumableOrganization[]> {
  const qx = pgpQx(svc.postgres.reader.connection())
  const result = await Promise.all(
    organizationIds.map((orgId) => {
      return prepareOrg(qx, orgId)
    }),
  )

  return result.filter((r) => r !== null)
}

export async function getRawOrganizationMergeSuggestions(
  tenantId: string,
  similarityFilter: ISimilarityFilter,
  limit: number,
  onlyLFXMembers = false,
  organizationIds: string[] = [],
): Promise<string[][]> {
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )

  const suggestions = await organizationMergeSuggestionsRepo.getRawOrganizationSuggestions(
    similarityFilter,
    limit,
    onlyLFXMembers,
    organizationIds,
  )
  if (onlyLFXMembers) {
    // make sure primary is lfx member
    for (let i = 0; i < suggestions.length; i++) {
      const qx = pgpQx(svc.postgres.reader.connection())
      const isPrimaryOrgInSuggestionLFXMember = await hasLfxMembership(qx, {
        organizationId: suggestions[i][0],
      })

      if (!isPrimaryOrgInSuggestionLFXMember) {
        suggestions[i] = [suggestions[i][1], suggestions[i][0]]
      }
    }
  }

  return suggestions
}

export async function removeOrganizationMergeSuggestions(
  suggestion: string[],
  table: OrganizationMergeSuggestionTable,
): Promise<void> {
  const organizationMergeSuggestionsRepo = new OrganizationMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  await organizationMergeSuggestionsRepo.removeOrganizationMergeSuggestions(suggestion, table)
}

export async function addOrganizationSuggestionToNoMerge(suggestion: string[]): Promise<void> {
  if (suggestion.length !== 2) {
    svc.log.debug(`Suggestions array must have two ids!`)
    return
  }
  const qx = pgpQx(svc.postgres.writer.connection())

  await addOrgNoMerge(qx, suggestion[0], suggestion[1])
}
