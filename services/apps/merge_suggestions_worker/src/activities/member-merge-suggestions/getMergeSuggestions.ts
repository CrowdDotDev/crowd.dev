/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IMemberPartialAggregatesOpensearch,
  IMemberPartialAggregatesOpensearchRawResult,
  IMemberQueryBody,
  ISimilarMemberOpensearch,
} from 'types'
import { svc } from '../../main'
import { IMemberMergeSuggestion, OpenSearchIndex } from '@crowd/types'
import { calculateSimilarity, prefixLength } from 'utils'
import MemberMergeSuggestionsRepository from 'repo/memberMergeSuggestions.repo'

/**
 * Finds similar members of given member in a tenant
 * Members are similar if:
 * - they have exactly same or similar looking identities (with max levenshtein distance = 2 OR same prefix)
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
    // push nested search scaffold for weak identities
    identitiesPartialQuery.should.push({
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
    })

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

    let hasFuzzySearch = false

    for (const identity of member.nested_identities) {
      if (identity.string_username.length > 0) {
        // weak identity search
        identitiesPartialQuery.should[1].nested.query.bool.should.push({
          bool: {
            must: [
              { match: { [`nested_weakIdentities.keyword_name`]: identity.string_username } },
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
        const cleanedIdentityName = identity.string_username.replace(/^https?:\/\//, '')

        if (Number.isNaN(Number(identity.string_username))) {
          hasFuzzySearch = true
          // fuzzy search for identities
          identitiesPartialQuery.should[2].nested.query.bool.should.push({
            match: {
              [`nested_identities.string_username`]: {
                query: cleanedIdentityName,
                prefix_length: 1,
                fuzziness: 'auto',
              },
            },
          })

          // also check for prefix for identities that has more than 5 characters and no whitespace
          if (identity.string_username.length > 5 && identity.string_username.indexOf(' ') === -1) {
            identitiesPartialQuery.should[2].nested.query.bool.should.push({
              prefix: {
                [`nested_identities.keyword_username`]: {
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
  }

  if (member.string_arr_emails && member.string_arr_emails.length > 0) {
    identitiesPartialQuery.should.push({
      terms: {
        keyword_emails: member.string_arr_emails,
      },
    })
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
      'nested_identities',
      'nested_weakIdentities',
      'keyword_displayName',
      'string_arr_emails',
      'int_activityCount',
    ],
  }

  const membersToMerge: ISimilarMemberOpensearch[] =
    (
      await svc.opensearch.client.search({
        index: OpenSearchIndex.MEMBERS,
        body: similarMembersQueryBody,
      })
    ).body?.hits?.hits || []

  for (const memberToMerge of membersToMerge) {
    mergeSuggestions.push({
      similarity: calculateSimilarity(member, memberToMerge._source),
      activityEstimate:
        (memberToMerge._source.int_activityCount || 0) + (member.int_activityCount || 0),
      members: [member.uuid_memberId, memberToMerge._source.uuid_memberId],
    })
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

export async function findTenantsLatestSuggestionCreatedAt(tenantId: string): Promise<string> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  return memberMergeSuggestionsRepo.findTenantsLatestSuggestionCreatedAt(tenantId)
}

export async function getMembers(
  tenantId: string,
  batchSize: number = 100,
  afterMemberId?: string,
  lastCreatedAt?: string,
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
        'nested_identities',
        'uuid_arr_noMergeIds',
        'keyword_displayName',
        'string_arr_emails',
        'int_activityCount',
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

    if (lastCreatedAt) {
      queryBody.query.bool.filter.push({
        range: {
          date_createdAt: {
            gt: new Date(lastCreatedAt).toISOString(),
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
