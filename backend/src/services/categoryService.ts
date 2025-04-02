import {
  connectCategoriesToCategoryGroup, createCategory,
  createCategoryGroup, deleteCategories, deleteCategory, deleteCategoryGroup, getCategoryById,
  ICategoryGroupsFilters, ICreateCategory,
  ICreateCategoryGroup,
  ICreateCategoryGroupWithCategories, listCategoriesBySlug,
  listCategoryGroups, listCategoryGroupsCount, listGroupListCategories, updateCategory,
  updateCategoryGroup,
} from '@crowd/data-access-layer/src/categories'
import {LoggerBase} from '@crowd/logging'

import slugify from 'slugify'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import {IServiceOptions} from './IServiceOptions'

export class CategoryService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super()
    this.options = options
  }

  async createCategoryGroup(categoryGroup: ICreateCategoryGroupWithCategories) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const slug = slugify(categoryGroup.name, {
        lower: true,
      })

      const createdCategoryGroup = await createCategoryGroup(qx, {
        ...categoryGroup,
        slug,
      })

      if (categoryGroup.categories) {
        await connectCategoriesToCategoryGroup(
          qx,
          createdCategoryGroup.id,
          categoryGroup.categories,
        )
      }
      return true
    })
  }

  async updateCategoryGroup(categoryGroupId: string, data: ICreateCategoryGroup) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const slug = slugify(data.name, {
        lower: true,
      })

      return updateCategoryGroup(qx,
          categoryGroupId,
          {
            ...data,
            slug,
          }
      )
    })
  }

  async deleteCategoryGroup(categoryGroupId: string) {
      const qx = SequelizeRepository.getQueryExecutor(this.options)

      return deleteCategoryGroup(qx, categoryGroupId)
  }

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



  async createCategory(category: ICreateCategory) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      let slug = slugify(category.name, {
        lower: true,
      })

      const categoriesWithSameSlug = await listCategoriesBySlug(qx, slug)

      if(categoriesWithSameSlug.length > 0) {
        slug = `${slug}-${categoriesWithSameSlug.length}`
      }

      return createCategory(qx, {
        ...category,
        slug,
      })
    })
  }

  async updateCategory(categoryId: string, data: ICreateCategory) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const currentCategory = await getCategoryById(qx, categoryId)

      let slug = currentCategory.slug

      if(currentCategory.name !== data.name) {
        slug = slugify(data.name, {
          lower: true,
        })

        const categoriesWithSameSlug = await listCategoriesBySlug(qx, slug)

        if(categoriesWithSameSlug.length > 0) {
          slug = `${slug}-${categoriesWithSameSlug.length + 1}`
        }
      }

      return updateCategory(qx,
          categoryId,
          {
            ...data,
            slug,
          }
      )
    })
  }


  async deleteCategory(categoryId: string) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    return deleteCategory(qx, categoryId)
  }


  async deleteCategories(ids: string[]) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    return deleteCategories(qx, ids)
  }
}
