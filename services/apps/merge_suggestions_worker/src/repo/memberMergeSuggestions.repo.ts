import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberMergeSuggestion } from '@crowd/types'
import { IMemberId, IMemberNoMerge, IMemberMergeSuggestionsLatestCreatedAt } from 'types'
import { chunkArray, removeDuplicateSuggestions } from 'utils'

class MemberMergeSuggestionsRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async findNoMergeIds(memberId: string): Promise<string[]> {
    try {
      const results: IMemberNoMerge[] = await this.connection.any(
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

  async findTenantsLatestSuggestionCreatedAt(tenantId: string): Promise<string> {
    try {
      const result: IMemberMergeSuggestionsLatestCreatedAt = await this.connection.oneOrNone(
        `
        select max(mtm."createdAt") as "latestCreatedAt"
        from "memberToMerge" mtm
        inner join members m on mtm."memberId" = m.id
        where m."tenantId" = $(tenantId);`,
        {
          tenantId,
        },
      )
      return result?.latestCreatedAt
    } catch (err) {
      throw new Error(err)
    }
  }

  async addToMerge(suggestions: IMemberMergeSuggestion[]): Promise<void> {
    // Remove possible duplicates
    suggestions = removeDuplicateSuggestions(suggestions)

    // check all suggestion ids exists in the db
    const uniqueMemberIds = Array.from(
      suggestions.reduce((acc, suggestion) => {
        acc.add(suggestion.members[0])
        acc.add(suggestion.members[1])
        return acc
      }, new Set<string>()),
    )

    // filter non existing member ids from suggestions
    const nonExistingIds = await this.findNonExistingIds(uniqueMemberIds)

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
      activityEstimate: number | null,
      index: number,
    ) => {
      const idPlaceholder = (key: string) => `${key}${index}`
      return {
        query: `($(${idPlaceholder('memberId')}), $(${idPlaceholder(
          'toMergeId',
        )}), $(${idPlaceholder('similarity')}), $(${idPlaceholder(
          'activityEstimate',
        )}), NOW(), NOW())`,
        replacements: {
          [idPlaceholder('memberId')]: memberId,
          [idPlaceholder('toMergeId')]: toMergeId,
          [idPlaceholder('similarity')]: similarity,
          [idPlaceholder('activityEstimate')]: activityEstimate,
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
          suggestion.activityEstimate,
          index,
        )
        placeholders.push(query)
        replacements = { ...replacements, ...chunkReplacements }
      })

      const query = `
        INSERT INTO "memberToMerge" ("memberId", "toMergeId", "similarity", "activityEstimate", "createdAt", "updatedAt")
        VALUES ${placeholders.join(', ')}
        on conflict do nothing;
      `
      try {
        await this.connection.any(query, replacements)
      } catch (error) {
        this.log.error('Error adding members to merge', error)
        throw error
      }
    }
  }

  async findNonExistingIds(memberIds: string[]): Promise<string[]> {
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
      const results: IMemberId[] = await this.connection.any(query)

      return results.map((r) => r.id)
    } catch (error) {
      this.log.error('Error while getting non existing members from db', error)
      throw error
    }
  }
}

export default MemberMergeSuggestionsRepository
