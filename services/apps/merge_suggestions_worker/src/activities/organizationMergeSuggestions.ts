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
    `[V2] Organization ${organization.id} (${organization.displayName}): ${fullOrg.identities.length} identities`,
  )

  if (fullOrg.identities.length === 0) {
    svc.log.info(`[V2] No identities found for ${organization.id}`)
    return []
  }

  const noMergeIds = await organizationMergeSuggestionsRepo.findNoMergeIds(fullOrg.id)
  const excludeIds = [fullOrg.id]

  if (noMergeIds && noMergeIds.length > 0) {
    excludeIds.push(...noMergeIds)
  }

  // deduplicate identities, sort verified first
  const identities = uniqBy(fullOrg.identities, (i) => `${i.platform}:${i.value}`).sort((a, b) =>
    a.verified === b.verified ? 0 : a.verified ? -1 : 1,
  )

  // Store weak identities as individual value+platform pairs (matching V1 semantics)
  // Weak identity search: ALL identities (verified + unverified) → searches in OTHER unverified identities
  // Fuzzy/Prefix search: ALL identities (verified + unverified) → searches in OTHER verified identities
  // Note: The filter bool_verified:true means searching IN OTHER verified, not filtering OUR identities
  const weakIdentities: Array<{ value: string; platform: string }> = []
  const identitiesForFuzzy: Array<{ value: string; cleanedValue: string }> = []
  const identitiesForPrefix: Array<{
    value: string
    cleanedValue: string
    prefix: string
  }> = []

  // Process ALL identities for query building (limit to 100)
  // Original logic: uses ALL identities for all searches, regardless of verified status
  const identitiesToProcess = identities.slice(0, 100)

  for (const identity of identitiesToProcess) {
    if (identity.value.length > 0) {
      // Store weak identities as individual value+platform pairs (matching V1 semantics)
      // Weak identity search: searches for our identities in OTHER organizations' unverified identities
      weakIdentities.push({
        value: identity.value,
        platform: identity.platform,
      })

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
  // Build optimized query structure
  const identitiesShould = []
  const CHUNK_SIZE = 20 // Chunk identities to avoid clause explosion

  // 1. Weak identity searches - FIXED to match V1 semantics
  // V1 creates individual bool queries per identity value+platform pair
  // We'll create the same structure but chunk the overall identitiesShould array
  let weakIdentityQueriesCreated = 0
  for (const { value, platform } of weakIdentities) {
    // Match V1 exactly: each identity gets its own bool query with must: [match value, match platform, term verified:false]
    identitiesShould.push({
      bool: {
        must: [
          { match: { [`nested_identities.string_value`]: value } },
          { match: { [`nested_identities.string_platform`]: platform } },
          { term: { [`nested_identities.bool_verified`]: false } },
        ],
      },
    })
    weakIdentityQueriesCreated++
  }

  // 2. Combined fuzzy searches (deduplicate cleaned values, chunked)
  // prefix_length limits fuzzy expansion by requiring exact prefix match
  let fuzzyQueryCount = 0
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
            prefix_length: 1, // Match V1 behavior - consistent prefix_length for all
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
      fuzzyQueryCount++
    }
  }

  // 3. Combined prefix searches (deduplicate prefixes)
  let prefixQueryCount = 0
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
      prefixQueryCount++
    }
  }

  // Chunk identitiesShould array if it exceeds safe limits to prevent max clause errors
  // OpenSearch max_clause_count is typically 1024, but we'll be conservative
  const MAX_SAFE_IDENTITY_QUERIES = 300 // Conservative limit to stay well under 1024
  type QueryClause = {
    bool: {
      must?: Array<Record<string, unknown>>
      should?: Array<Record<string, unknown>>
      filter?: Array<Record<string, unknown>>
      minimum_should_match?: number
    }
  }
  const identityQueryChunks: QueryClause[][] = []

  if (identitiesShould.length > MAX_SAFE_IDENTITY_QUERIES) {
    svc.log.warn(
      `[V2] 🔄 CHUNKING ACTIVATED: ${identitiesShould.length} queries exceed safe limit (${MAX_SAFE_IDENTITY_QUERIES})`,
    )
    for (let i = 0; i < identitiesShould.length; i += MAX_SAFE_IDENTITY_QUERIES) {
      identityQueryChunks.push(identitiesShould.slice(i, i + MAX_SAFE_IDENTITY_QUERIES))
    }
    svc.log.info(
      `[V2] Split into ${identityQueryChunks.length} chunks (${identityQueryChunks.map((c) => c.length).join(', ')} queries per chunk)`,
    )
  } else {
    identityQueryChunks.push(identitiesShould)
  }

  // Build nested query clauses - one for each chunk
  const nestedIdentityQueries = identityQueryChunks.map((chunk) => ({
    nested: {
      path: 'nested_identities',
      query: {
        bool: {
          should: chunk,
          minimum_should_match: 1,
        },
      },
    },
  }))

  // Build the main query structure
  const identitiesPartialQuery = {
    should: [
      {
        term: {
          [`keyword_displayName`]: fullOrg.displayName,
        },
      },
      ...(nestedIdentityQueries.length > 0 ? nestedIdentityQueries : []),
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

  // Calculate clause count more accurately
  // The main concern is the number of clauses in bool query's should array
  // Each nested query counts as 1 clause in the top-level should array
  let estimatedClauseCount = 1 // displayName term
  estimatedClauseCount += nestedIdentityQueries.length // nested identity queries (each counts as 1 clause)
  estimatedClauseCount += excludeIds.length // must_not terms (each ID counts as 1 clause)
  estimatedClauseCount += 1 // tenantId filter (doesn't count toward should clause limit, but including for completeness)

  // Log key metrics for testing
  svc.log.info(
    `[V2] Query stats: ${identitiesShould.length} total queries (weak: ${weakIdentityQueriesCreated}, fuzzy: ${fuzzyQueryCount}, prefix: ${prefixQueryCount}), ${nestedIdentityQueries.length} nested query${nestedIdentityQueries.length > 1 ? 's' : ''}, ~${estimatedClauseCount} estimated clauses`,
  )

  if (estimatedClauseCount > 800) {
    svc.log.warn(`[V2] WARNING: Clause count (${estimatedClauseCount}) approaching limit (1024)`)
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
      `[V2] Query executed in ${searchDuration}ms, found ${organizationsToMerge.length} matches`,
    )
  } catch (e) {
    svc.log.error(
      { error: e, query: identitiesPartialQuery },
      '[V2] Error while searching for similar organizations!',
    )
    throw e
  }

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
    `[V2] Completed: ${mergeSuggestions.length} merge suggestions for ${organization.id} (${organization.displayName})`,
  )

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
