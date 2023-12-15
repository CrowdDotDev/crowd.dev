/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IMemberId,
  IMemberNoMerge,
  IMemberPartialAggregatesOpensearch,
  ISimilarMember,
  ISimilarMemberOpensearch,
} from 'types'
import { svc } from '../../main'
import { IMemberMergeSuggestion, OpenSearchIndex } from '@crowd/types'
import { calculateSimilarity, chunkArray, prefixLength, removeDuplicateSuggestions } from 'utils'

export async function getMergeSuggestions(
  tenantId: string,
  member: IMemberPartialAggregatesOpensearch,
): Promise<IMemberMergeSuggestion[]> {
  console.log(`Getting merge suggestions for ${member.uuid_memberId}`)
  const mergeSuggestions: IMemberMergeSuggestion[] = []

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
              [`nested_identities.keyword_username`]: {
                query: cleanedIdentityName,
                prefix_length: 1,
                fuzziness: '2',
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

  const noMergeIds = await findNoMergeIds(member.uuid_memberId)

  if (noMergeIds && noMergeIds.length > 0) {
    for (const noMergeId of noMergeIds) {
      identitiesPartialQuery.must_not.push({
        term: {
          uuid_organizationId: noMergeId,
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
    console.log('A')
    mergeSuggestions.push({
      similarity: calculateSimilarity(member, memberToMerge._source),
      members: [member.uuid_memberId, memberToMerge._source.uuid_memberId],
    })
  }

  console.log('Returning merge suggestions')
  console.log(mergeSuggestions)

  return mergeSuggestions
}

export async function addToMerge(suggestions: IMemberMergeSuggestion[]): Promise<void> {
  console.log('ADDING TO MERGE SUGGESTIONS ')
  console.log(suggestions)
  // Remove possible duplicates
  suggestions = removeDuplicateSuggestions(suggestions)

  // check all suggestion ids exists in the db
  const uniqueOrganizationIds = Array.from(
    suggestions.reduce((acc, suggestion) => {
      acc.add(suggestion.members[0])
      acc.add(suggestion.members[1])
      return acc
    }, new Set<string>()),
  )

  // filter non existing member ids from suggestions
  const nonExistingIds = await findNonExistingIds(uniqueOrganizationIds)

  suggestions = suggestions.filter(
    (s) => !nonExistingIds.includes(s.members[0]) && !nonExistingIds.includes(s.members[1]),
  )

  // Process suggestions in chunks of 100 or less
  const suggestionChunks: IMemberMergeSuggestion[][] = chunkArray<IMemberMergeSuggestion>(
    suggestions,
    100,
  )

  const insertValues = (
    memberId: string,
    toMergeId: string,
    similarity: number | null,
    index: number,
  ) => {
    const idPlaceholder = (key: string) => `${key}${index}`
    return {
      query: `($(${idPlaceholder('memberId')}), $(${idPlaceholder('toMergeId')}), $(${idPlaceholder(
        'similarity',
      )}), NOW(), NOW())`,
      replacements: {
        [idPlaceholder('memberId')]: memberId,
        [idPlaceholder('toMergeId')]: toMergeId,
        [idPlaceholder('similarity')]: similarity,
      },
    }
  }

  for (const suggestionChunk of suggestionChunks) {
    const placeholders: string[] = []
    let replacements: Record<string, unknown> = {}

    suggestionChunk.forEach((suggestion, index) => {
      const { query, replacements: chunkReplacements } = insertValues(
        suggestion.members[0],
        suggestion.members[1],
        suggestion.similarity,
        index,
      )
      placeholders.push(query)
      replacements = { ...replacements, ...chunkReplacements }
    })

    const query = `
      INSERT INTO "memberToMerge" ("memberId", "toMergeId", "similarity", "createdAt", "updatedAt")
      VALUES ${placeholders.join(', ')}
      on conflict do nothing;
    `
    try {
      await svc.postgres.writer.connection().any(query, replacements)
    } catch (error) {
      svc.log.error('error adding members to merge', error)
      throw error
    }
  }
}

async function findNonExistingIds(memberIds: string[]): Promise<string[]> {
  let idValues = ``

  for (let i = 0; i < memberIds.length; i++) {
    idValues += `('${memberIds[i]}'::uuid)`

    if (i !== memberIds.length - 1) {
      idValues += ','
    }
  }

  const query = `WITH id_list (id) AS (
    VALUES
        ${idValues}
      )
      SELECT id
      FROM id_list
      WHERE NOT EXISTS (
          SELECT 1
          FROM members m
          WHERE m.id = id_list.id
      );`

  try {
    const results: IMemberId[] = await svc.postgres.writer.connection().any(query)

    return results.map((r) => r.id)
  } catch (error) {
    svc.log.error('Error while getting non existing members from db', error)
    throw error
  }
}

async function findNoMergeIds(memberId: string): Promise<string[]> {
  try {
    const results: IMemberNoMerge[] = await svc.postgres.writer.connection().any(
      `select mnm."memberId", mnm."noMergeId" from "memberNoMerge" mnm
      where mnm."memberId" = $(id) or mnm."noMergeId" = $(id);`,
      {
        id: memberId,
      },
    )
    return Array.from(
      results.reduce((acc, r) => {
        if (memberId === r.memberId) {
          acc.add(r.noMergeId)
        } else if (memberId === r.noMergeId) {
          acc.add(r.memberId)
        }
        return acc
      }, new Set<string>()),
    )
  } catch (err) {
    throw new Error(err)
  }
}
