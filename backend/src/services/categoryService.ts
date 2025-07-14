import { getCleanString } from '@crowd/common'
import {
  ICategoryFilters,
  ICategoryGroupsFilters,
  ICreateCategory,
  ICreateCategoryGroupWithCategories,
  createCategory,
  createCategoryGroup,
  deleteCategories,
  deleteCategory,
  deleteCategoryGroup,
  getCategoryById,
  getCategoryGroupById,
  listCategories,
  listCategoriesBySlug,
  listCategoryGroups,
  listCategoryGroupsBySlug,
  listCategoryGroupsCount,
  listGroupListCategories,
  updateCategory,
  updateCategoryGroup,
} from '@crowd/data-access-layer/src/categories'
import { getServiceLogger, LoggerBase } from '@crowd/logging'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'
import { LlmService } from '@crowd/common_services'

export class CategoryService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super()
    this.options = options
  }

  /**
   * Creates a new category group with optional associated categories.
   *
   * @param {ICreateCategoryGroupWithCategories} categoryGroup - An object representing the category group to be created, which may include associated categories.
   * @return {Promise<boolean>} A promise that resolves to true if the category group is successfully created.
   */
  async createCategoryGroup(categoryGroup: ICreateCategoryGroupWithCategories) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      let slug = getCleanString(categoryGroup.name).replace(/\s+/g, '-')

      const categoryGroupsWithSameSlug = await listCategoryGroupsBySlug(qx, slug)

      if (categoryGroupsWithSameSlug.length > 0) {
        slug = `${slug}-${categoryGroupsWithSameSlug.length}`
      }

      const createdCategoryGroup = await createCategoryGroup(qx, {
        ...categoryGroup,
        slug,
      })

      if (categoryGroup.categories) {
        for (const category of categoryGroup.categories) {
          let slug = getCleanString(category.name).replace(/\s+/g, '-')

          const categoriesWithSameSlug = await listCategoriesBySlug(qx, slug)

          if (categoriesWithSameSlug.length > 0) {
            slug = `${slug}-${categoriesWithSameSlug.length}`
          }

          await createCategory(qx, {
            ...category,
            slug,
            categoryGroupId: createdCategoryGroup.id,
          })
        }
      }
      return true
    })
  }

  /**
   * Updates an existing category group with the specified data.
   *
   * @param {string} categoryGroupId - The unique identifier of the category group to update.
   * @param {ICreateCategoryGroup} data - The data to update the category group with.
   * @return {Promise<object>} A promise that resolves to the updated category group object.
   */
  async updateCategoryGroup(categoryGroupId: string, data: ICreateCategoryGroupWithCategories) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const currentCategoryGroup = await getCategoryGroupById(qx, categoryGroupId)

      let slug = currentCategoryGroup.slug

      if (currentCategoryGroup.name !== data.name) {
        slug = getCleanString(data.name).replace(/\s+/g, '-')

        const categoryGroupsWithSameSlug = await listCategoryGroupsBySlug(qx, slug)

        if (categoryGroupsWithSameSlug.length > 0) {
          slug = `${slug}-${categoryGroupsWithSameSlug.length + 1}`
        }
      }

      await updateCategoryGroup(qx, categoryGroupId, {
        ...data,
        slug,
      })

      if (data.categories) {
        const existingCategories = await listGroupListCategories(qx, [categoryGroupId])
        const existingCategoryIds = existingCategories.map((category) => category.id)
        const newCategoryIds = data.categories.map((category) => category.id)
        const categoriesToDelete = existingCategoryIds.filter((id) => !newCategoryIds.includes(id))
        const categoriesToCreate = data.categories.filter((category) => !category.id)
        const categoriesToUpdate = data.categories.filter((category) =>
          existingCategoryIds.includes(category.id),
        )

        if (categoriesToDelete.length > 0) {
          await deleteCategories(qx, categoriesToDelete)
        }
        for (const category of categoriesToCreate) {
          await this.createCategory({
            ...category,
            categoryGroupId,
          })
        }
        for (const category of categoriesToUpdate) {
          await this.updateCategory(category.id, {
            ...category,
            categoryGroupId,
          })
        }
      }

      return true
    })
  }

  /**
   * Deletes a category group by its unique identifier.
   *
   * @param {string} categoryGroupId - The unique identifier of the category group to delete.
   * @return {Promise<any>} A promise that resolves when the category group is successfully deleted.
   */
  async deleteCategoryGroup(categoryGroupId: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      return deleteCategoryGroup(qx, categoryGroupId)
    })
  }

  /**
   * Retrieves a list of category groups based on the provided filters.
   *
   * @param {ICategoryGroupsFilters} filters - The filters used to query category groups. Includes options like limit, offset, and other criteria.
   * @return {Promise<{rows: Array<Object>, count: number, limit: number, offset: number}>} A promise that resolves to an object containing:
   *         - rows: An array of category group objects with their associated categories.
   *         - count: The total number of category groups matching the filters.
   *         - limit: The number of category groups returned in the current batch.
   *         - offset: The starting point for the current batch of category groups.
   */
  async listCategoryGroups(filters: ICategoryGroupsFilters) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    let rows = await listCategoryGroups(qx, filters)
    const count = await listCategoryGroupsCount(qx, filters)

    const categoryGroupIds = rows.map((categoryGroup) => categoryGroup.id)

    const categories = await listGroupListCategories(qx, categoryGroupIds)

    rows = rows.map((row) => ({
      ...row,
      categories: categories.filter((category) => category.categoryGroupId === row.id),
    }))

    return {
      rows,
      count,
      limit: +filters.limit || 20,
      offset: +filters.offset || 0,
    }
  }

  /**
   * Creates a new category with a unique slug. If a category with the same slug already exists,
   * appends a number to the slug to ensure uniqueness.
   *
   * @param {ICreateCategory} category - The category object containing the details for the new category.
   * @return {Promise<object>} A promise that resolves to the created category object.
   */
  async createCategory(category: ICreateCategory) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      let slug = getCleanString(category.name).replace(/\s+/g, '-')

      const categoriesWithSameSlug = await listCategoriesBySlug(qx, slug)

      if (categoriesWithSameSlug.length > 0) {
        slug = `${slug}-${categoriesWithSameSlug.length}`
      }

      return createCategory(qx, {
        ...category,
        slug,
      })
    })
  }

  /**
   * Updates the details of an existing category, including its name and slug.
   * If the category name has been modified, it generates a new unique slug.
   *
   * @param {string} categoryId - The ID of the category to be updated.
   * @param {ICreateCategory} data - The updated data for the category, including name and other properties.
   * @return {Promise<Object>} A promise that resolves to the updated category details.
   */
  async updateCategory(categoryId: string, data: ICreateCategory) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const currentCategory = await getCategoryById(qx, categoryId)

      let slug = currentCategory.slug

      if (currentCategory.name !== data.name) {
        slug = getCleanString(data.name).replace(/\s+/g, '-')

        const categoriesWithSameSlug = await listCategoriesBySlug(qx, slug)

        if (categoriesWithSameSlug.length > 0) {
          slug = `${slug}-${categoriesWithSameSlug.length + 1}`
        }
      }

      return updateCategory(qx, categoryId, {
        ...data,
        slug,
      })
    })
  }

  /**
   * Deletes a category based on the provided category ID.
   *
   * @param {string} categoryId - The unique identifier of the category to be deleted.
   * @return {Promise<any>} A promise that resolves when the category is successfully deleted.
   */
  async deleteCategory(categoryId: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      return deleteCategory(qx, categoryId)
    })
  }

  /**
   * Deletes categories based on the provided list of IDs.
   *
   * @param {string[]} ids - An array of category IDs to be deleted.
   * @return {Promise<any>} A promise that resolves with the result of the deletion operation.
   */
  async deleteCategories(ids: string[]) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      return deleteCategories(qx, ids)
    })
  }

  async listCategories(filters: ICategoryFilters) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const rows = await listCategories(qx, filters)

    const groupedCategories = rows.reduce((acc, row) => {
      if (!acc[row.categoryGroupId]) {
        acc[row.categoryGroupId] = {
          id: row.categoryGroupId,
          name: row.categoryGroupName,
          categories: [],
        }
      }
      acc[row.categoryGroupId].categories.push({
        id: row.id,
        name: row.name,
      })
      return acc
    }, {})

    return {
      rows: Object.values(groupedCategories),
      limit: +filters.limit || 20,
      offset: +filters.offset || 0,
    }
  }

  static formatCategories(items: {
    id: string
    name: string
    categoryGroupId: string
    categoryGroupName: string
  }[]): string {

    const groups = new Map<string, string[]>();
    for (const item of items) {
      const group = item.categoryGroupName;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item.name + '-' + item.id);
    }

    let result = "";
    for (const [groupName, names] of groups) {
      result += `## ${groupName}\n`;
      for (const name of names) {
        result += `- ${name}\n`;
      }
      result += "\n";
    }
    return result.trim();
  }


  public async findRepoCategoriesWithLLM(
    {
      repo_url,
      repo_description,
      repo_topics,
      repo_homepage,
    }: {
      repo_url: string,
      repo_description: string,
      repo_topics: string[],
      repo_homepage: string,
    }
  ): Promise<{ categories: string[], explanation: string }> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    // TODO: handling pagination
    const categories = await listCategories(qx, {
      query: '',
      limit: 1000,
      offset: 0,
      groupType: null,
    })

    const category_structure_text = CategoryService.formatCategories(categories)

    const prompt = `You are an expert open-source analyst. Your job is to classify ${repo_url} into appropriate categories.

      ## Context and Purpose
      This classification is part of the Open Source Index, a comprehensive catalog of the most critical open-source projects. 
      Developers and organizations use this index to:
      - Discover relevant open-source tools for their technology stack
      - Understand the open-source ecosystem in their domain
      - Make informed decisions about which projects to adopt or contribute to
      - Assess the health and importance of projects in specific technology areas

      Accurate categorization is essential for users to find the right projects when browsing by technology domain or industry vertical.

      ## Project Information
      - URL: ${repo_url}
      - Description: ${repo_description}
      - Topics: ${repo_topics}
      - Homepage: ${repo_homepage}

      ## Available Categories
      These categories are organized by category groups:

      ${category_structure_text}

      ## Your Task
      Analyze the project and determine which categories it belongs to. A project can belong to multiple categories if appropriate.

      Consider:
      - The project's primary functionality and purpose
      - The technology domain it operates in
      - The industry or vertical it serves (if applicable)
      - How developers would expect to find this project when browsing by category

      If the project doesn't clearly fit into any of the available categories, return an empty list for categories.

      Return a JSON with the following format:
      {{
          "categories": ["Category1", "Category2", ...],
          "explanation": "Brief explanation of why you chose these categories"
      }}

      Only include categories from the provided list. Do not create new categories.
`

    const llmService = new LlmService(
      qx,
      {
        accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
      },
      getServiceLogger(),
    )

    const { result } = await llmService.findRepoCategories<{
      categories: string[]
      explanation: string
    }>(prompt)


    if (
      typeof result === 'object' &&
      result !== null &&
      Array.isArray(result.categories) &&
      result.categories.every(cat => typeof cat === 'string') &&
      typeof result.explanation === 'string'
    ) {
      return {
        categories: result.categories,
        explanation: result.explanation,
      };
    }

    return null
  }
}
