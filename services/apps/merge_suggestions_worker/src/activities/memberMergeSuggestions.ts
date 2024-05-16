/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IMemberPartialAggregatesOpensearch,
  IMemberPartialAggregatesOpensearchRawResult,
  IMemberQueryBody,
  ISimilarMemberOpensearch,
} from '../types'
import { svc } from '../main'
import { ILLMConsumableMember, IMemberMergeSuggestion, OpenSearchIndex } from '@crowd/types'
import MemberMergeSuggestionsRepository from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/memberMergeSuggestions.repo'
import MemberSimilarityCalculator from '../memberSimilarityCalculator'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { logExecutionTime } from '@crowd/logging'

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
  member: IMemberPartialAggregatesOpensearch,
): Promise<IMemberMergeSuggestion[]> {
  const SIMILARITY_CONFIDENCE_SCORE_THRESHOLD = 0.5
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
      if (identity.keyword_value && identity.keyword_value.length > 0) {
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
    const similarityConfidenceScore = MemberSimilarityCalculator.calculateSimilarity(
      member,
      memberToMerge._source,
    )
    if (similarityConfidenceScore > SIMILARITY_CONFIDENCE_SCORE_THRESHOLD) {
      // decide the primary member using number of activities & number of identities
      const membersSorted = [member, memberToMerge._source].sort((a, b) => {
        if (
          a.nested_identities.length > b.nested_identities.length ||
          (a.nested_identities.length === b.nested_identities.length &&
            a.int_activityCount > b.int_activityCount)
        ) {
          return -1
        } else if (
          a.nested_identities.length < b.nested_identities.length ||
          (a.nested_identities.length === b.nested_identities.length &&
            a.int_activityCount < b.int_activityCount)
        ) {
          return 1
        }
        return 0
      })
      mergeSuggestions.push({
        similarity: similarityConfidenceScore,
        activityEstimate:
          (memberToMerge._source.int_activityCount || 0) + (member.int_activityCount || 0),
        members: [membersSorted[0].uuid_memberId, membersSorted[1].uuid_memberId],
      })
    }
  }

  return mergeSuggestions
}

export async function addMemberToMerge(suggestions: IMemberMergeSuggestion[]): Promise<void> {
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
        'nested_identities',
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

export async function getLLMResult(
  members: ILLMConsumableMember[],
  modelId: string,
  prompt: string,
  region: string,
  modelSpecificArgs: any,
): Promise<string> {
  if (members.length !== 2) {
    throw new Error('Exactly 2 members are required for LLM comparison')
  }
  const client = new BedrockRuntimeClient({
    credentials: {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    region,
  })

  const promptPrologue = ` ${JSON.stringify(members)} `

  console.log('Prompt:', promptPrologue)

  const command = new InvokeModelCommand({
    body: JSON.stringify({
      prompt: `${promptPrologue} ${prompt}`,
      ...modelSpecificArgs,
    }),
    modelId,
    accept: 'application/json',
    contentType: 'application/json',
  })

  const res = await logExecutionTime(async () => client.send(command), svc.log, 'llm-invoke-model')

  return res.body.transformToString()
}

export async function getMembersForLLMConsumption(
  memberIds: string[],
): Promise<ILLMConsumableMember[]> {
  const memberMergeSuggestionsRepo = new MemberMergeSuggestionsRepository(
    svc.postgres.writer.connection(),
    svc.log,
  )
  return memberMergeSuggestionsRepo.getMembers(memberIds)
}
