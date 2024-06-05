import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IOrganizationMergeSuggestion,
  OrganizationMergeSuggestionTable,
  SuggestionType,
} from '@crowd/types'
import {
  IOrganizationId,
  IOrganizationMergeSuggestionsLatestGeneratedAt,
  IOrganizationNoMerge,
} from './types'
import { removeDuplicateSuggestions, chunkArray } from './utils'

class OrganizationMergeSuggestionsRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async findNoMergeIds(organizationId: string): Promise<string[]> {
    try {
      const results: IOrganizationNoMerge[] = await this.connection.any(
        `select onm."organizationId", onm."noMergeId" from "organizationNoMerge" onm
        where onm."organizationId" = $(id) or onm."noMergeId" = $(id);`,
        {
          id: organizationId,
        },
      )
      return Array.from(
        results.reduce((acc, r) => {
          if (organizationId === r.organizationId) {
            acc.add(r.noMergeId)
          } else if (organizationId === r.noMergeId) {
            acc.add(r.organizationId)
          }
          return acc
        }, new Set<string>()),
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  async findTenantsLatestOrganizationSuggestionGeneratedAt(tenantId: string): Promise<string> {
    try {
      const result: IOrganizationMergeSuggestionsLatestGeneratedAt =
        await this.connection.oneOrNone(
          `
        select "organizationMergeSuggestionsLastGeneratedAt"
        from tenants
        where "id" = $(tenantId);`,
          {
            tenantId,
          },
        )
      return result?.organizationMergeSuggestionsLastGeneratedAt
    } catch (err) {
      throw new Error(err)
    }
  }

  async updateOrganizationMergeSuggestionsLastGeneratedAt(tenantId: string): Promise<void> {
    try {
      await this.connection.any(
        `
          update tenants set "organizationMergeSuggestionsLastGeneratedAt" = now()
          where "id" = $(tenantId);
        `,
        {
          tenantId,
        },
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  async addToMerge(
    suggestions: IOrganizationMergeSuggestion[],
    table: OrganizationMergeSuggestionTable,
  ): Promise<void> {
    // Remove possible duplicates
    suggestions = removeDuplicateSuggestions<IOrganizationMergeSuggestion>(
      suggestions,
      SuggestionType.ORGANIZATIONS,
    )

    // check all suggestion ids exists in the db
    const uniqueOrganizationIds = Array.from(
      suggestions.reduce((acc, suggestion) => {
        acc.add(suggestion.organizations[0])
        acc.add(suggestion.organizations[1])
        return acc
      }, new Set<string>()),
    )

    // filter non existing organization ids from suggestions
    const nonExistingIds = await this.findNonExistingIds(uniqueOrganizationIds)

    suggestions = suggestions.filter(
      (s) =>
        !nonExistingIds.includes(s.organizations[0]) &&
        !nonExistingIds.includes(s.organizations[1]),
    )

    // Process suggestions in chunks of 100 or less
    const suggestionChunks: IOrganizationMergeSuggestion[][] =
      chunkArray<IOrganizationMergeSuggestion>(suggestions, 100)

    const insertValues = (
      organizationId: string,
      toMergeId: string,
      similarity: number | null,
      index: number,
    ) => {
      const idPlaceholder = (key: string) => `${key}${index}`
      return {
        query: `($(${idPlaceholder('organizationId')})::uuid, $(${idPlaceholder(
          'toMergeId',
        )})::uuid, $(${idPlaceholder('similarity')}), NOW(), NOW())`,
        replacements: {
          [idPlaceholder('organizationId')]: organizationId,
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
          suggestion.organizations[0],
          suggestion.organizations[1],
          suggestion.similarity,
          index,
        )
        placeholders.push(query)
        replacements = { ...replacements, ...chunkReplacements }
      })

      const query = `
        insert into "${table}" ("organizationId", "toMergeId", "similarity", "createdAt", "updatedAt")
        select new_vals.*
        from (
          values
            ${placeholders.join(', ')}
        ) AS new_vals ("organizationId", "toMergeId", "similarity", "createdAt", "updatedAt")
        where not exists (
          select 1
          from "${table}"
          where ("organizationId" = new_vals."organizationId"::uuid AND "toMergeId" = new_vals."toMergeId"::uuid) 
          or ("organizationId" = new_vals."toMergeId"::uuid AND "toMergeId" = new_vals."organizationId"::uuid)
        );
      `
      try {
        await this.connection.any(query, replacements)
      } catch (error) {
        this.log.error('Error adding organizations to merge', error)
        throw error
      }
    }
  }

  async findNonExistingIds(organizationIds: string[]): Promise<string[]> {
    let idValues = ``

    for (let i = 0; i < organizationIds.length; i++) {
      idValues += `('${organizationIds[i]}'::uuid)`

      if (i !== organizationIds.length - 1) {
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
            FROM organizations o
            WHERE o.id = id_list.id
        );`

    try {
      const results: IOrganizationId[] = await this.connection.any(query)

      return results.map((r) => r.id)
    } catch (error) {
      this.log.error('Error while getting non existing organizations from db', error)
      throw error
    }
  }
}

export default OrganizationMergeSuggestionsRepository
