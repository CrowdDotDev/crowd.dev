/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IMemberPartialAggregatesOpensearch,
  IMemberPartialAggregatesOpensearchRawResult,
  IMemberQueryBody,
  ISimilarMemberOpensearch,
} from '../../types'
import { svc } from '../../main'
import { IMemberMergeSuggestion, OpenSearchIndex } from '@crowd/types'
import { calculateSimilarity } from '../../utils'
import MemberMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/memberMergeSuggestions.repo'

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
export async function getMergeSuggestions(
  tenantId: string,
  member: IMemberPartialAggregatesOpensearch,
): Promise<IMemberMergeSuggestion[]> {
  const SIMILARITY_CONFIDENCE_SCORE_THRESHOLD = 0.9
  const mergeSuggestions: IMemberMergeSuggestion[] = []
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  const identitiesPartialQuery: any = {
    should: [
      {
        term: {
          [`keyword_displayName`]: member.keyword_displayName,
        },
      },
    ],
    minimum_should_match: 1,
    must_not: [
      {
        term: {
          uuid_memberId: member.uuid_memberId,
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

  if (member.nested_identities && member.nested_identities.length > 0) {
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
    for (const identity of member.nested_identities.slice(0, 200)) {
      if (identity.keyword_value.length > 0) {
        // For verified identities (either email or username)
        // 1. Exact search the identity in other unverified identities
        // 2. Fuzzy search the identity in other verified identities
        if (identity.bool_verified) {
          identitiesPartialQuery.should[1].nested.query.bool.should.push({
            bool: {
              must: [
                { term: { [`nested_identities.keyword_value`]: identity.keyword_value } },
                {
                  match: {
                    [`nested_identities.string_platform`]: identity.string_platform,
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
          const cleanedIdentityName = identity.string_value.replace(/^https?:\/\//, '')

          if (Number.isNaN(Number(identity.string_value))) {
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
                  {
                    term: {
                      [`nested_identities.bool_verified`]: true,
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
                { term: { [`nested_identities.keyword_name`]: identity.keyword_value } },
                {
                  match: {
                    [`nested_identities.string_platform`]: identity.string_platform,
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

  const noMergeIds = await memberMergeSuggestionsRepo.findNoMergeIds(member.uuid_memberId)

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
    collapse: {
      field: 'uuid_memberId',
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

  let membersToMerge: ISimilarMemberOpensearch[]

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
    const similarityConfidenceScore = calculateSimilarity(member, memberToMerge._source)
    if (similarityConfidenceScore > SIMILARITY_CONFIDENCE_SCORE_THRESHOLD) {
      mergeSuggestions.push({
        similarity: similarityConfidenceScore,
        activityEstimate:
          (memberToMerge._source.int_activityCount || 0) + (member.int_activityCount || 0),
        members: [member.uuid_memberId, memberToMerge._source.uuid_memberId],
      })
    }
  }

  return mergeSuggestions
}

export async function addToMerge(suggestions: IMemberMergeSuggestion[]): Promise<void> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  await memberMergeSuggestionsRepo.addToMerge(suggestions)
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
): Promise<IMemberPartialAggregatesOpensearch[]> {
  try {
    const queryBody: IMemberQueryBody = {
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
        [`uuid_memberId`]: 'asc',
      },
      collapse: {
        field: 'uuid_memberId',
      },
      _source: [
        'uuid_memberId',
        'uuid_arr_noMergeIds',
        'keyword_displayName',
        'int_activityCount',
        'string_arr_verifiedEmails',
        'string_arr_unverifiedEmails',
        'string_arr_verifiedUsernames',
        'string_arr_unverifiedUsernames',
        'obj_attributes',
        'nested_organizations',
      ],
    }

    if (afterMemberId) {
      queryBody.query.bool.filter.push({
        range: {
          uuid_memberId: {
            gt: afterMemberId,
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

    const members: IMemberPartialAggregatesOpensearchRawResult[] =
      (
        await svc.opensearch.client.search({
          index: OpenSearchIndex.MEMBERS,
          body: queryBody,
        })
      ).body?.hits?.hits || []

    return members.map((member) => member._source)
  } catch (err) {
    throw new Error(err)
  }
}
