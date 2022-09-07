/* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */
import { IServiceOptions } from './IServiceOptions'
import { PageData, SearchCriteria } from '../types/common'

export abstract class ServiceBase<TData, TId, TCreate, TUpdate, TCriteria extends SearchCriteria> {
  protected constructor(public readonly options: IServiceOptions) {}

  create(data: TCreate): Promise<TData> {
    throw new Error('create is not implemented!')
  }

  update(id: TId, data: TUpdate): Promise<TData> {
    throw new Error('update is not implemented')
  }

  destroy(id: TId): Promise<void> {
    return this.destroyAll([id])
  }

  destroyAll(ids: TId[]): Promise<void> {
    throw new Error('destroyAll is not implemented!')
  }

  findById(id: TId): Promise<TData> {
    throw new Error('findById is not implemented!')
  }

  findAndCountAll(criteria: TCriteria): Promise<PageData<TData>> {
    throw new Error('findAndCountAll is not implemented!')
  }
}
