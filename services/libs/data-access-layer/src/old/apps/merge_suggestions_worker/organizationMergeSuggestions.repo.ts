import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import {
  IOrganizationMergeSuggestion,
  LlmQueryType,
  OrganizationMergeSuggestionTable,
  SuggestionType,
} from '@crowd/types'

import {
  IFindRawOrganizationMergeSuggestionsReplacement,
  IOrganizationId,
  IOrganizationMergeSuggestionsLatestGeneratedAt,
  IOrganizationNoMerge,
  IRawOrganizationMergeSuggestionResult,
} from './types'
import { chunkArray, removeDuplicateSuggestions } from './utils'

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

  /**
   * We get raw (unfiltered) suggestions from the database.
   * When onlyLFXMembers is true it only returns suggestions for lfx member organizations.
   * All returned suggestions are checked against the "llmPromptHistory" table to see if they have already been processed.
   * Already processed suggestions will not be returned.
   * @param similarityFilter
   * @param limit
   * @param onlyLFXMembers
   * @returns
   */
  async getRawOrganizationSuggestions(
    similarityFilter: { lte: number; gte: number },
    limit: number,
    onlyLFXMembers = false,
    organizationIds = [],
  ): Promise<string[][]> {
    const replacements: IFindRawOrganizationMergeSuggestionsReplacement = { limit }

    let query: string
    let organizationIdFilter = ''
    let similarityLTEFilter = ''
    let similarityGTEFilter = ''

    if (similarityFilter && similarityFilter.lte) {
      similarityLTEFilter = ` and otmr."similarity" <= $(similarityLTEFilter)`
      replacements.similarityLTEFilter = similarityFilter.lte
    }

    if (similarityFilter && similarityFilter.gte) {
      similarityGTEFilter = ` and otmr."similarity" >= $(similarityGTEFilter)`
      replacements.similarityGTEFilter = similarityFilter.gte
    }

    if (organizationIds.length > 0) {
      organizationIdFilter = ` and (otmr."organizationId" in ($(organizationIds:csv)) or otmr."toMergeId" in ($(organizationIds:csv)))`
      replacements.organizationIds = organizationIds
    }
    if (onlyLFXMembers) {
      query = `with suggestions as (
                        select otmr."organizationId", otmr."toMergeId" from "organizationToMergeRaw" otmr
                        where exists(
                            select 1 from "lfxMemberships" lfm
                            where otmr."organizationId" = lfm."organizationId" or
                                  otmr."toMergeId" = lfm."organizationId"
                        )
                        ${similarityLTEFilter}
                        ${similarityGTEFilter}
                        ${organizationIdFilter}
                     )
                     select distinct s."organizationId", s."toMergeId"
                     from suggestions s
                     where not exists (
                          select 1 from "llmPromptHistory" lsv
                          where (
                              lsv."entityId" = s."organizationId" and
                              (lsv.metadata ->> 'secondaryId')::uuid = s."toMergeId" and
                              lsv.type = '${LlmQueryType.ORGANIZATION_MERGE}'
                            )
                              or
                            (
                              lsv."entityId" = s."toMergeId" and
                              (lsv.metadata ->> 'secondaryId')::uuid = s."organizationId" and
                              lsv.type = '${LlmQueryType.ORGANIZATION_MERGE}'

                            )
                     )
                     order by s."organizationId" desc
                     limit $(limit);`
    } else {
      query = `select * from "organizationToMergeRaw" otmr
                     where
                     not exists (
                          select 1 from "llmPromptHistory" lsv
                          where (
                              lsv."entityId" = otmr."organizationId" and
                              (lsv.metadata ->> 'secondaryId')::uuid = otmr."toMergeId" and
                              lsv.type = '${LlmQueryType.ORGANIZATION_MERGE}'
                            )
                              or
                            (
                              lsv."entityId" = otmr."toMergeId" and
                              (lsv.metadata ->> 'secondaryId')::uuid = otmr."organizationId" and
                              lsv.type = '${LlmQueryType.ORGANIZATION_MERGE}'
                            )
                     )
                     ${similarityLTEFilter}
                     ${similarityGTEFilter}
                     order by otmr."organizationId" desc
                     limit $(limit);`
    }

    const results: IRawOrganizationMergeSuggestionResult[] = await this.connection.any(
      query,
      replacements,
    )

    return results.map((r) => [r.organizationId, r.toMergeId])
  }
}

export default OrganizationMergeSuggestionsRepository
