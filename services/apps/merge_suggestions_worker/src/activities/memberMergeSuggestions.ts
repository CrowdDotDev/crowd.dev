/* eslint-disable @typescript-eslint/no-explicit-any */
import { MemberField, queryMembers } from '@crowd/data-access-layer/src/members'
import MemberMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/memberMergeSuggestions.repo'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { buildFullMemberForMergeSuggestions } from '@crowd/opensearch'
import {
  ILLMConsumableMember,
  IMemberBaseForMergeSuggestions,
  IMemberMergeSuggestion,
  MemberMergeSuggestionTable,
  OpenSearchIndex,
} from '@crowd/types'

import { svc } from '../main'
import MemberSimilarityCalculator from '../memberSimilarityCalculator'
import { ISimilarMemberOpensearchResult, ISimilarityFilter } from '../types'

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

  const identitiesPartialQuery: any = {
    should: [
      {
        term: {
          [`keyword_displayName`]: fullMember.displayName,
        },
      },
    ],
    minimum_should_match: 1,
    must_not: [
      {
        term: {
          uuid_memberId: fullMember.id,
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

  if (fullMember.identities && fullMember.identities.length > 0) {
    // push nested search scaffold for strong identities
    identitiesPartialQuery.should.push({
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
    })

    // prevent processing more than 200 identities because of opensearch limits
    for (const identity of fullMember.identities.slice(0, 200)) {
      if (identity.value && identity.value.length > 0) {
        // For verified identities (either email or username)
        // 1. Exact search the identity in other unverified identities
        // 2. Fuzzy search the identity in other verified identities
        if (identity.verified) {
          identitiesPartialQuery.should[1].nested.query.bool.should.push({
            bool: {
              must: [
                { term: { [`nested_identities.keyword_value`]: identity.value } },
                {
                  match: {
                    [`nested_identities.string_platform`]: identity.platform,
                  },
                },
                {
                  term: {
                    [`nested_identities.bool_verified`]: false,
                  },
                },
              ],
            },
          })

          // some identities have https? in the beginning, resulting in false positive suggestions
          // remove these when making fuzzy and wildcard searches
          const cleanedIdentityName = identity.value.replace(/^https?:\/\//, '')

          if (Number.isNaN(Number(identity.value))) {
            // fuzzy search for identities
            identitiesPartialQuery.should[1].nested.query.bool.should.push({
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
                ],
              },
            })
          }
        } else {
          // exact search the unverified identity in other verified identities
          identitiesPartialQuery.should[1].nested.query.bool.should.push({
            bool: {
              must: [
                { term: { [`nested_identities.keyword_value`]: identity.value } },
                {
                  match: {
                    [`nested_identities.string_platform`]: identity.platform,
                  },
                },
                {
                  term: {
                    [`nested_identities.bool_verified`]: true,
                  },
                },
              ],
            },
          })
        }
      }
    }
  }

  const noMergeIds = await memberMergeSuggestionsRepo.findNoMergeIds(member.id)

  if (noMergeIds && noMergeIds.length > 0) {
    for (const noMergeId of noMergeIds) {
      identitiesPartialQuery.must_not.push({
        term: {
          uuid_memberId: noMergeId,
        },
      })
    }
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
    svc.log.info(
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
          lastGeneratedAt ? { [MemberField.CREATED_AT]: { gt: lastGeneratedAt } } : null,
        ],
      },
      fields: [
        MemberField.ID,
        MemberField.TENANT_ID,
        MemberField.DISPLAY_NAME,
        MemberField.ATTRIBUTES,
      ],
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
      id: primaryMember.id,
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
      id: secondaryMember.id,
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
