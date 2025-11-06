/* eslint-disable @typescript-eslint/no-explicit-any */
import uniqBy from 'lodash.uniqby'

import { addMemberNoMerge } from '@crowd/data-access-layer/src/member_merge'
import { MemberField, queryMembers } from '@crowd/data-access-layer/src/members'
import MemberMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/memberMergeSuggestions.repo'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { buildFullMemberForMergeSuggestions } from '@crowd/opensearch'
import {
  ILLMConsumableMember,
  IMemberBaseForMergeSuggestions,
  IMemberMergeSuggestion,
  MemberIdentityType,
  MemberMergeSuggestionTable,
  OpenSearchIndex,
  PlatformType,
} from '@crowd/types'

import { svc } from '../main'
import MemberSimilarityCalculator from '../memberSimilarityCalculator'
import { ISimilarMemberOpensearchResult, ISimilarityFilter } from '../types'
import { chunkArray } from '../utils'

import { EMAIL_AS_USERNAME_PLATFORMS } from './common'

/**
 * Finds similar members of given member in a tenant
 * Members are similar if:
 * - they have exactly same or similar looking identities (with max levenshtein distance = 2)
 * - they have exactly same emails
 * - they have exactly same display name
 * @param tenantId
 * @param member
 * @returns similar members in an array with calculated similarity score and activityEstimate
 * Activity estimate is calculated by adding activity counts of both members
 */
export async function getMemberMergeSuggestions(
  tenantId: string,
  member: IMemberBaseForMergeSuggestions,
): Promise<IMemberMergeSuggestion[]> {
  const mergeSuggestions: IMemberMergeSuggestion[] = []
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )

  const qx = pgpQx(svc.postgres.reader.connection())
  const fullMember = await buildFullMemberForMergeSuggestions(qx, member)

  // Deduplicate and sort verified identities first
  const identities = uniqBy(fullMember.identities, (i) => `${i.platform}:${i.value}`).sort(
    (a, b) => (a.verified === b.verified ? 0 : a.verified ? -1 : 1),
  )

  // Early return if no identities to match against
  if (identities.length === 0) {
    return []
  }

  // Get members that should not be merged
  const noMergeIds = await memberMergeSuggestionsRepo.findNoMergeIds(member.id)
  const excludeIds = [fullMember.id]
  if (noMergeIds && noMergeIds.length > 0) {
    excludeIds.push(...noMergeIds)
  }

  // Categorize identities into different query types
  const verifiedExactMatches = []
  const verifiedEmailUsernameMatches = []
  const verifiedUsernameEmailMatches = []
  const verifiedFuzzyMatches = []

  const unverifiedExactMatches = []
  const unverifiedEmailUsernameMatches = []
  const unverifiedUsernameEmailMatches = []

  // Process up to 100 identities
  // This is a safety limit to prevent OpenSearch max clause errors
  for (const identity of identities.slice(0, 100)) {
    if (identity.value && identity.value.length > 0) {
      if (identity.verified) {
        // Verified identities: exact match on unverified identities
        verifiedExactMatches.push({
          value: identity.value,
          platform: identity.platform,
        })

        // Email-as-username: verified email matching unverified username
        if (identity.type === MemberIdentityType.EMAIL) {
          verifiedEmailUsernameMatches.push({
            value: identity.value,
          })
        }

        // Email-as-username: verified username matching unverified email
        if (
          identity.type === MemberIdentityType.USERNAME &&
          EMAIL_AS_USERNAME_PLATFORMS.includes(identity.platform as PlatformType)
        ) {
          verifiedUsernameEmailMatches.push({
            value: identity.value,
          })
        }

        // Fuzzy search for verified identities (non-numeric only)
        if (Number.isNaN(Number(identity.value))) {
          const cleanedIdentityName = identity.value.replace(/^https?:\/\//, '')
          verifiedFuzzyMatches.push({
            value: identity.value,
            cleanedValue: cleanedIdentityName,
          })
        }
      } else {
        // Unverified identities: exact match on verified identities
        unverifiedExactMatches.push({
          value: identity.value,
          platform: identity.platform,
        })

        // Email-as-username: unverified email matching verified username
        if (identity.type === MemberIdentityType.EMAIL) {
          unverifiedEmailUsernameMatches.push({
            value: identity.value,
          })
        }

        // Email-as-username: unverified username matching verified email
        if (
          identity.type === MemberIdentityType.USERNAME &&
          EMAIL_AS_USERNAME_PLATFORMS.includes(identity.platform as PlatformType)
        ) {
          unverifiedUsernameEmailMatches.push({
            value: identity.value,
          })
        }
      }
    }
  }

  // Build OpenSearch query clauses
  const identitiesShould = []
  const CHUNK_SIZE = 20 // Split queries into chunks to avoid OpenSearch limits

  // Query 1: Verified -> Unverified exact matches
  for (const { value, platform } of verifiedExactMatches) {
    identitiesShould.push({
      bool: {
        must: [
          { term: { [`nested_identities.keyword_value`]: value } },
          { match: { [`nested_identities.string_platform`]: platform } },
          { term: { [`nested_identities.bool_verified`]: false } },
        ],
      },
    })
  }

  // Query 2: Verified email -> Unverified username (email-as-username platforms)
  for (const { value } of verifiedEmailUsernameMatches) {
    identitiesShould.push({
      bool: {
        must: [
          { term: { [`nested_identities.keyword_value`]: value } },
          { terms: { [`nested_identities.string_platform`]: EMAIL_AS_USERNAME_PLATFORMS } },
          { term: { [`nested_identities.keyword_type`]: MemberIdentityType.USERNAME } },
          { term: { [`nested_identities.bool_verified`]: false } },
        ],
      },
    })
  }

  // Query 3: Verified username -> Unverified email (email-as-username platforms)
  for (const { value } of verifiedUsernameEmailMatches) {
    identitiesShould.push({
      bool: {
        must: [
          { term: { [`nested_identities.keyword_value`]: value } },
          { term: { [`nested_identities.keyword_type`]: MemberIdentityType.EMAIL } },
          { term: { [`nested_identities.bool_verified`]: false } },
        ],
      },
    })
  }

  // Query 4: Verified -> Verified fuzzy matches (chunked)
  if (verifiedFuzzyMatches.length > 0) {
    const uniqueFuzzyValues = [
      ...new Set(verifiedFuzzyMatches.map(({ cleanedValue }) => cleanedValue)),
    ]
    const fuzzyChunks = chunkArray(uniqueFuzzyValues, CHUNK_SIZE)

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

      identitiesShould.push({
        bool: {
          should: fuzzyShouldClauses,
          minimum_should_match: 1,
        },
      })
    }
  }

  // Query 5: Unverified -> Verified exact matches
  for (const { value, platform } of unverifiedExactMatches) {
    identitiesShould.push({
      bool: {
        must: [
          { term: { [`nested_identities.keyword_value`]: value } },
          { match: { [`nested_identities.string_platform`]: platform } },
          { term: { [`nested_identities.bool_verified`]: true } },
        ],
      },
    })
  }

  // Query 6: Unverified email -> Verified username (email-as-username platforms)
  for (const { value } of unverifiedEmailUsernameMatches) {
    identitiesShould.push({
      bool: {
        must: [
          { term: { [`nested_identities.keyword_value`]: value } },
          { terms: { [`nested_identities.string_platform`]: EMAIL_AS_USERNAME_PLATFORMS } },
          { term: { [`nested_identities.keyword_type`]: MemberIdentityType.USERNAME } },
          { term: { [`nested_identities.bool_verified`]: true } },
        ],
      },
    })
  }

  // Query 7: Unverified username -> Verified email (email-as-username platforms)
  for (const { value } of unverifiedUsernameEmailMatches) {
    identitiesShould.push({
      bool: {
        must: [
          { term: { [`nested_identities.keyword_value`]: value } },
          { term: { [`nested_identities.keyword_type`]: MemberIdentityType.EMAIL } },
          { term: { [`nested_identities.bool_verified`]: true } },
        ],
      },
    })
  }

  // Wrap all identity queries in a nested query (identities are nested documents)
  const nestedIdentityQuery = {
    nested: {
      path: 'nested_identities',
      query: {
        bool: {
          should: identitiesShould,
          boost: 1,
          minimum_should_match: 1,
        },
      },
    },
  }

  // Main query: match by display name OR any of the identity queries
  const identitiesPartialQuery: any = {
    should: [
      {
        term: {
          [`keyword_displayName`]: fullMember.displayName,
        },
      },
      ...(identitiesShould.length > 0 ? [nestedIdentityQuery] : []),
    ],
    minimum_should_match: 1,
    must_not: [
      {
        terms: {
          uuid_memberId: excludeIds,
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

  const similarMembersQueryBody = {
    query: {
      bool: identitiesPartialQuery,
    },
    _source: [
      'uuid_memberId',
      'keyword_displayName',
      'int_activityCount',
      'nested_identities',
      'obj_attributes',
      'nested_organizations',
    ],
  }

  let membersToMerge: ISimilarMemberOpensearchResult[]

  try {
    membersToMerge =
      (
        await svc.opensearch.client.search({
          index: OpenSearchIndex.MEMBERS,
          body: similarMembersQueryBody,
        })
      ).body?.hits?.hits || []
  } catch (e) {
    svc.log.error(
      { error: e, query: identitiesPartialQuery },
      'Error while searching for similar members!',
    )
    throw e
  }

  for (const memberToMerge of membersToMerge) {
    const similarityConfidenceScore = MemberSimilarityCalculator.calculateSimilarity(
      fullMember,
      memberToMerge._source,
    )
    // decide the primary member using number of activities & number of identities
    const membersSorted = [
      fullMember,
      {
        id: memberToMerge._source.uuid_memberId,
        activityCount: memberToMerge._source.int_activityCount,
        identities: memberToMerge._source.nested_identities,
      },
    ].sort((a, b) => {
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
    })
    mergeSuggestions.push({
      similarity: similarityConfidenceScore,
      activityEstimate:
        (membersSorted[0].activityCount || 0) + (membersSorted[1].activityCount || 0),
      members: [membersSorted[0].id, membersSorted[1].id],
    })
  }

  return mergeSuggestions
}

export async function addMemberToMerge(
  suggestions: IMemberMergeSuggestion[],
  table: MemberMergeSuggestionTable,
): Promise<void> {
  if (suggestions.length > 0) {
    const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
      svc.postgres.writer.connection(),
      svc.log,
    )
    await memberMergeSuggestionsRepo.addToMerge(suggestions, table)
  }
}

export async function findTenantsLatestMemberSuggestionGeneratedAt(
  tenantId: string,
): Promise<string> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  return memberMergeSuggestionsRepo.findTenantsLatestMemberSuggestionGeneratedAt(tenantId)
}

export async function updateMemberMergeSuggestionsLastGeneratedAt(tenantId: string): Promise<void> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  await memberMergeSuggestionsRepo.updateMemberMergeSuggestionsLastGeneratedAt(tenantId)
}

export async function getMembers(
  tenantId: string,
  batchSize: number,
  afterMemberId?: string,
  lastGeneratedAt?: string,
): Promise<IMemberBaseForMergeSuggestions[]> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())
    const rows = await queryMembers(qx, {
      filter: {
        and: [
          { [MemberField.TENANT_ID]: { eq: tenantId } },
          afterMemberId ? { [MemberField.ID]: { gt: afterMemberId } } : null,
          // Include members updated after the last generation to cover both new and modified ones
          lastGeneratedAt ? { [MemberField.UPDATED_AT]: { gt: lastGeneratedAt } } : null,
        ],
      },
      fields: [
        MemberField.ID,
        MemberField.TENANT_ID,
        MemberField.DISPLAY_NAME,
        MemberField.ATTRIBUTES,
      ],
      orderBy: `${MemberField.ID} asc`,
      limit: batchSize,
    })

    return rows
  } catch (err) {
    throw new Error(err)
  }
}

export async function getMembersForLLMConsumption(
  memberIds: string[],
): Promise<ILLMConsumableMember[]> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  const [primaryMember, secondaryMember] = await memberMergeSuggestionsRepo.getMembers(memberIds)

  const result: ILLMConsumableMember[] = []

  if (primaryMember) {
    result.push({
      displayName: primaryMember.displayName,
      joinedAt: primaryMember.joinedAt,
      attributes: primaryMember.attributes,
      identities: primaryMember.identities.map((i) => ({ platform: i.platform, value: i.value })),
      organizations: primaryMember.organizations.map((o) => ({
        title: o.title,
        logo: o.logo,
        displayName: o.displayName,
        dateEnd: o.dateEnd,
        dateStart: o.dateStart,
      })),
    })
  }

  if (secondaryMember) {
    result.push({
      joinedAt: secondaryMember.joinedAt,
      displayName: secondaryMember.displayName,
      attributes: secondaryMember.attributes,
      identities: secondaryMember.identities.map((i) => ({ platform: i.platform, value: i.value })),
      organizations: secondaryMember.organizations.map((o) => ({
        title: o.title,
        logo: o.logo,
        displayName: o.displayName,
        dateEnd: o.dateEnd,
        dateStart: o.dateStart,
      })),
    })
  }

  return result
}

export async function getRawMemberMergeSuggestions(
  similarityFilter: ISimilarityFilter,
  limit: number,
): Promise<string[][]> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  return memberMergeSuggestionsRepo.getRawMemberSuggestions(similarityFilter, limit)
}

export async function removeMemberMergeSuggestion(
  suggestion: string[],
  table: MemberMergeSuggestionTable,
): Promise<void> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  await memberMergeSuggestionsRepo.removeMemberMergeSuggestion(suggestion, table)
}

export async function addMemberSuggestionToNoMerge(suggestion: string[]): Promise<void> {
  if (suggestion.length !== 2) {
    svc.log.debug(`Suggestions array must have two ids!`)
    return
  }
  const qx = pgpQx(svc.postgres.writer.connection())

  await addMemberNoMerge(qx, suggestion[0], suggestion[1])
}
