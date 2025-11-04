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

  // deduplicate identities, sort verified first
  const identities = uniqBy(fullOrg.identities, (i) => `${i.platform}:${i.value}`).sort((a, b) =>
    a.verified === b.verified ? 0 : a.verified ? -1 : 1,
  )

  const weakIdentities: Array<{ value: string; platform: string }> = []
  const identitiesForFuzzy: Array<{ value: string; cleanedValue: string }> = []
  const identitiesForPrefix: Array<{
    value: string
    cleanedValue: string
    prefix: string
  }> = []

  for (const identity of identities.slice(0, 100)) {
    if (identity.value.length > 0) {
      weakIdentities.push({
        value: identity.value,
        platform: identity.platform,
      })

      let cleanedIdentityName = identity.value.replace(/^https?:\/\//, '')

      if (identity.platform === 'linkedin') {
        cleanedIdentityName = cleanedIdentityName.split(':').pop() || cleanedIdentityName
      }

      if (Number.isNaN(Number(identity.value))) {
        identitiesForFuzzy.push({
          value: identity.value,
          cleanedValue: cleanedIdentityName,
        })

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
  const identitiesShould = []
  const CHUNK_SIZE = 20

  for (const { value, platform } of weakIdentities) {
    const weakQuery = {
      bool: {
        must: [
          { match: { [`nested_identities.string_value`]: value } },
          { match: { [`nested_identities.string_platform`]: platform } },
          { term: { [`nested_identities.bool_verified`]: false } },
        ],
      },
    }
    identitiesShould.push(weakQuery)
  }

  if (identitiesForFuzzy.length > 0) {
    const uniqueFuzzyValues = [
      ...new Set(identitiesForFuzzy.map(({ cleanedValue }) => cleanedValue)),
    ]
    const fuzzyChunks: string[][] = []
    for (let i = 0; i < uniqueFuzzyValues.length; i += CHUNK_SIZE) {
      fuzzyChunks.push(uniqueFuzzyValues.slice(i, i + CHUNK_SIZE))
    }

    for (const chunk of fuzzyChunks) {
      const fuzzyShouldClauses = chunk.map((cleanedValue) => ({
        match: {
          [`nested_identities.string_value`]: {
            query: cleanedValue,
            prefix_length: 1,
            fuzziness: 'auto',
          },
        },
      }))

      const fuzzyQuery = {
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
      }
      identitiesShould.push(fuzzyQuery)
    }
  }

  if (identitiesForPrefix.length > 0) {
    const uniquePrefixes = [...new Set(identitiesForPrefix.map(({ prefix }) => prefix))]
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

      const prefixQuery = {
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
      }
      identitiesShould.push(prefixQuery)
    }
  }

  const nestedIdentityQuery = {
    nested: {
      path: 'nested_identities',
      query: {
        bool: {
          should: identitiesShould,
          minimum_should_match: 1,
        },
      },
    },
  }

  const identitiesPartialQuery = {
    should: [
      {
        term: {
          [`keyword_displayName`]: fullOrg.displayName,
        },
      },
      ...(identitiesShould.length > 0 ? [nestedIdentityQuery] : []),
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
    svc.log.error(
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
