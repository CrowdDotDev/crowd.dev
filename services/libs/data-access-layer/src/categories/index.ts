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

export interface ICategory {
  id: string
  name: string
  slug: string
  categoryGroupId: string
  createdAt: string
  updatedAt: string
}

export interface ICreateCategory {
  name: string
  slug: string
  categoryGroupId?: string
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

export async function listGroupListCategories(
  qx: QueryExecutor,
  categoryGroupIds: string[],
): Promise<ICategory[]> {
  return qx.select(
    `
            SELECT id, name, slug, "categoryGroupId"
            FROM "categories"
            WHERE "categoryGroupId" = ANY($(categoryGroupIds)::uuid[])
            ORDER BY "categoryGroupId"
        `,
    {
      categoryGroupIds,
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

export async function getCategoryById(qx: QueryExecutor, id: string): Promise<ICategory> {
  return qx.selectOne(
    `
          SELECT id, slug, name
          FROM "categories"
          WHERE id = $(id)
      `,
    {
      id,
    },
  )
}

export async function listCategoriesBySlug(qx: QueryExecutor, slug: string): Promise<ICategory[]> {
  return qx.select(
    `
          SELECT slug
          FROM "categories"
          WHERE slug = $(slug)
             OR slug ~ $(slugRegex)
      `,
    {
      slug,
      slugRegex: `^${slug}-[0-9]+$`,
    },
  )
}

export async function createCategory(
  qx: QueryExecutor,
  category: ICreateCategory,
): Promise<ICategory> {
  return qx.selectOne(
    `
            INSERT INTO "categories" (name, slug, "categoryGroupId")
            VALUES ($(name), $(slug), $(categoryGroupId))
            RETURNING *
        `,
    {
      name: category.name,
      slug: category.slug,
      categoryGroupId: category.categoryGroupId || null,
    },
  )
}

export async function updateCategory(
  qx: QueryExecutor,
  categoryId: string,
  data: Partial<ICreateCategory>,
): Promise<ICategoryGroup> {
  return qx.selectOne(
    `
            UPDATE "categories"
            SET
                name = COALESCE($(name), name),
                slug = COALESCE($(slug), slug),
                "categoryGroupId" = COALESCE($(categoryGroupId), "categoryGroupId"),
                "updatedAt" = NOW()
            WHERE id = $(categoryId)
            RETURNING *
        `,
    {
      categoryId,
      name: data.name,
      slug: data.slug,
      categoryGroupId: data.categoryGroupId,
    },
  )
}

export async function deleteCategory(qx: QueryExecutor, categoryId: string): Promise<ICategory> {
  return qx.selectOne(
    `
            DELETE
            FROM "categories"
            WHERE id = $(categoryId)
            RETURNING *
        `,
    {
      categoryId,
    },
  )
}

export async function deleteCategories(qx: QueryExecutor, ids: string[]): Promise<ICategory[]> {
  return qx.select(
    `
            DELETE
            FROM "categories"
            WHERE id = ANY($(ids)::uuid[])
            RETURNING *
        `,
    {
      ids,
    },
  )
}
