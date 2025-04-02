import {
  connectCategoriesToCategoryGroup,
  createCategoryGroup, deleteCategoryGroup,
  ICategoryGroupsFilters,
  ICreateCategoryGroup,
  ICreateCategoryGroupWithCategories,
  listCategoryGroups, listCategoryGroupsCount,
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
    const rows = await listCategoryGroups(qx, filters)
    const count = await listCategoryGroupsCount(qx, filters)

    return {
      rows,
      count,
      limit: +filters.limit || 20,
      offset: +filters.offset || 0,
    }
  }
}
