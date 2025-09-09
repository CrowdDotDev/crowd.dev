import { QueryExecutor } from '../queryExecutor'

/**
 * Represents a group of repositories with associated metadata.
 *
 * This interface defines the structure for keeping information about
 * a repository group, including its unique identifier, name, slug,
 * associated repositories, and metadata for insights or analytics.
 */
export interface IRepositoryGroup {
  id: string
  name: string
  slug: string
  repositories: string[]
  insightsProjectId: string
  createdAt: string
  updatedAt: string
}

/**
 * Represents the filters applicable to a repository group in an insights project.
 */
export interface IRepositoryGroupFilters {
  insightsProjectId: string
}

/**
 * Interface representing a request to create a repository group.
 *
 * This interface defines the structure required to create a group that organizes repositories under a single entity. Each group is identified by a unique name and slug, and associates a collection of repositories with an insights project.
 *
 * Properties:
 * - `name`: A string representing the display name of the repository group.
 * - `slug`: A unique string identifier for the repository group, typically URL-friendly and derived from the name.
 * - `insightsProjectId`: A string identifier linking the repository group to an insights project for analytics or reporting purposes.
 * - `repositories`: An array of strings containing the identifiers or names of the repositories to be included in the group.
 */
export interface ICreateRepositoryGroup {
  id?: string;
  name: string
  slug: string
  insightsProjectId: string
  repositories: string[]
}

/**
 * Creates a new repository group in the database and returns the created group.
 *
 * @param {QueryExecutor} qx - The query executor used for database operations.
 * @param {ICreateRepositoryGroup} repositoryGroup - The repository group object containing the necessary data for creation.
 * @return {Promise<IRepositoryGroup>} A promise that resolves to the created repository group.
 */
export async function createRepositoryGroup(
  qx: QueryExecutor,
  repositoryGroup: ICreateRepositoryGroup,
): Promise<IRepositoryGroup> {
  return qx.selectOne(
    `
            INSERT INTO "repositoryGroups" (name, slug, repositories, "insightsProjectId")
            VALUES ($(name), $(slug), $(repositories), $(insightsProjectId))
            RETURNING *
        `,
    repositoryGroup,
  )
}

/**
 * Retrieves a list of repository groups based on the provided filters.
 *
 * @param {QueryExecutor} qx - The query executor used to perform database operations.
 * @param {IRepositoryGroupFilters} filters - An object containing filters to apply to the query.
 *        Filters may include an `insightsProjectId` to narrow down the repository groups.
 * @return {Promise<IRepositoryGroup[]>} A promise that resolves to an array of repository groups matching the filters.
 */
export async function listRepositoryGroups(
  qx: QueryExecutor,
  filters: IRepositoryGroupFilters,
): Promise<IRepositoryGroup[]> {
  return qx.select(
    `
            SELECT id, name, slug, repositories, "insightsProjectId"
            FROM "repositoryGroups"
            WHERE "insightsProjectId" = COALESCE($(insightsProjectId), "insightsProjectId")
            AND "deletedAt" IS NULL
            ORDER BY "createdAt"
        `,
    {
      insightsProjectId: filters.insightsProjectId || null,
    },
  )
}

/**
 * Updates an existing repository group with the provided data.
 *
 * @param {QueryExecutor} qx - The query executor used to perform database operations.
 * @param {string} repositoryGroupId - The ID of the repository group to update.
 * @param {Partial<ICreateRepositoryGroup>} data - Partial data object containing the fields to update in the repository group.
 * @return {Promise<IRepositoryGroup>} A promise that resolves to the updated repository group.
 */
export async function updateRepositoryGroup(
  qx: QueryExecutor,
  repositoryGroupId: string,
  data: Partial<ICreateRepositoryGroup>,
): Promise<IRepositoryGroup> {
  return qx.selectOne(
    `
            UPDATE "repositoryGroups"
            SET
                name = COALESCE($(name), name),
                slug = COALESCE($(slug), slug),
                repositories = COALESCE($(repositories), repositories),
                "updatedAt" = NOW()
            WHERE id = $(repositoryGroupId)
            RETURNING *
        `,
    {
      repositoryGroupId,
      name: data.name,
      slug: data.slug,
      repositories: data.repositories,
    },
  )
}

/**
 * Deletes a repository group by marking it as deleted and updating the relevant timestamps.
 *
 * @param {QueryExecutor} qx - An instance of QueryExecutor used to execute database queries.
 * @param {string} repositoryGroupId - The unique identifier of the repository group to be deleted.
 * @return {Promise<IRepositoryGroup>} A promise that resolves to the deleted repository group's information.
 */
export async function deleteRepositoryGroup(
  qx: QueryExecutor,
  repositoryGroupId: string,
): Promise<IRepositoryGroup> {
  return qx.selectOne(
    `
        UPDATE "repositoryGroups"
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $(repositoryGroupId)
        RETURNING *
    `,
    {
      repositoryGroupId,
    },
  )
}
