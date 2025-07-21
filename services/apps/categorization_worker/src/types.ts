import { ICategory } from '@crowd/data-access-layer/src/categories'

export interface IAutomaticCategorization {
  description: string
  github: string
  topics: string[]
  website: string
  segmentId: string
}

export type IFindCategoryParams = {
  description: string
  github: string
  topics: string[]
  website: string
}

export type IFindCollectionsParams = IFindCategoryParams & {
  categories: Partial<ICategory>[]
}

export type IListedCategory = {
  categoryGroupId: string
  categoryGroupName: string
  id: string
  name: string
}
