import { QueryExecutor } from '../queryExecutor'

export enum CategoryGroupType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export interface ICreateCategoryGroup {
  name: string
  type: CategoryGroupType
  slug: string
}

export interface ICategoryGroup {
  id: string
  name: string
  type: CategoryGroupType
  slug: string
  createdAt: string
  updatedAt: string
}

export interface ICreateCategory {
  name: string
  slug: string
  categoryGroupId: string
}

export interface ICreateCategoryGroupWithCategories extends ICreateCategoryGroup {
  categories?: string[]
}

export interface ICategoryGroupsFilters {
  type?: CategoryGroupType
  query?: string
  limit: number
  offset: number
}

export async function createCategoryGroup(
  qx: QueryExecutor,
  categoryGroup: ICreateCategoryGroup,
): Promise<ICategoryGroup> {
  return qx.selectOne(
    `
            INSERT INTO "categoryGroups" (name, type, slug)
            VALUES ($(name), $(type), $(slug))
            RETURNING *
        `,
    categoryGroup,
  )
}

export async function connectCategoriesToCategoryGroup(
  qx: QueryExecutor,
  categoryGroupId: string,
  categoryIds: string[],
): Promise<void> {
  return qx.result(
    `
      UPDATE "categories"
      SET "categoryGroupId" = $(categoryGroupId)
      WHERE id = ANY($(categoryIds)::uuid[])
    `,
    {
      categoryGroupId,
      categoryIds,
    },
  )
}

export async function listCategoryGroups(
  qx: QueryExecutor,
  filters: ICategoryGroupsFilters,
): Promise<ICategoryGroup[]> {
  return qx.select(
    `
            SELECT id, name, type
            FROM "categoryGroups"
            WHERE ($(type) IS NULL OR type = $(type))
              AND ($(query) = '' OR name ILIKE CONCAT('%', $(query), '%'))
            ORDER BY name
            LIMIT $(limit) OFFSET $(offset)
        `,
    {
      type: filters.type || null,
      query: filters.query || '',
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    },
  )
}

export async function listCategoryGroupsCount(
  qx: QueryExecutor,
  filters: ICategoryGroupsFilters,
): Promise<number> {
  const result = await qx.selectOne(
    `
            SELECT COUNT(*) as count
            FROM "categoryGroups"
            WHERE ($(type) IS NULL OR type = $(type))
              AND ($(query) = '' OR name ILIKE CONCAT('%', $(query), '%'))
        `,
    {
      type: filters.type || null,
      query: filters.query || '',
    },
  )
  return parseInt(result.count, 10)
}

export async function updateCategoryGroup(
  qx: QueryExecutor,
  categoryGroupId: string,
  data: Partial<ICreateCategoryGroup>,
): Promise<ICategoryGroup> {
  return qx.selectOne(
    `
            UPDATE "categoryGroups"
            SET
                name = COALESCE($(name), name),
                type = COALESCE($(type), type),
                slug = COALESCE($(slug), slug),
                "updatedAt" = NOW()
            WHERE id = $(categoryGroupId)
            RETURNING *
        `,
    {
      categoryGroupId,
      name: data.name,
      type: data.type,
      slug: data.slug,
    },
  )
}

export async function deleteCategoryGroup(
  qx: QueryExecutor,
  categoryGroupId: string,
): Promise<ICategoryGroup> {
  return qx.selectOne(
    `
            DELETE
            FROM "categoryGroups"
            WHERE id = $(categoryGroupId)
            RETURNING *
        `,
    {
      categoryGroupId,
    },
  )
}
