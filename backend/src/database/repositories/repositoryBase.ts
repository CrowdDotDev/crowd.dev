/* eslint-disable class-methods-use-this,@typescript-eslint/no-unused-vars */
import { Sequelize } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { PageData, SearchCriteria } from '../../types/common'
import AuditLogRepository from './auditLogRepository'
import SequelizeRepository from './sequelizeRepository'

export abstract class RepositoryBase<
  TData,
  TId,
  TCreate,
  TUpdate,
  TCriteria extends SearchCriteria,
> {
  protected constructor(
    public readonly options: IRepositoryOptions,
    public readonly log: boolean = false,
  ) {}

  protected get currentUser(): any {
    return SequelizeRepository.getCurrentUser(this.options)
  }

  protected get currentTenant(): any {
    return SequelizeRepository.getCurrentTenant(this.options)
  }

  protected get transaction(): any {
    return SequelizeRepository.getTransaction(this.options)
  }

  protected get seq(): Sequelize {
    return SequelizeRepository.getSequelize(this.options)
  }

  protected get database(): any {
    return this.options.database
  }

  create(data: TCreate): Promise<TData> {
    throw new Error('create is not implemented!')
  }

  update(id: TId, data: TUpdate): Promise<TData> {
    throw new Error('update is not implemented')
  }

  destroy(id: TId): Promise<void> {
    throw new Error('destroy is not implemented')
  }

  findById(id: TId): Promise<TData> {
    throw new Error('findById is not implemented')
  }

  findAndCountAll(criteria: TCriteria): Promise<PageData<TData>> {
    throw new Error('findAndCountAll is not implemented!')
  }

  async findAll(criteria: TCriteria): Promise<TData[]> {
    const copy = { ...criteria }

    // let's initially load just the first row in the db to see how many elements there are in total
    copy.offset = 0
    copy.limit = 1
    let page = await this.findAndCountAll(criteria)

    // check the count and load that many rows with the same criteria and offset=0
    let count = page.count
    copy.limit = count
    page = await this.findAndCountAll(criteria)

    // just in case count has changed between the first and the second findAndCountAll execution
    while (page.count !== count) {
      count = page.count
      copy.limit = count
      page = await this.findAndCountAll(criteria)
    }

    return page.rows
  }

  protected async createAuditLog(
    entity: string,
    action: string,
    record: any,
    data: any,
  ): Promise<void> {
    if (this.log) {
      let values = {}

      if (data) {
        values = {
          ...record.get({ plain: true }),
        }
      }

      await AuditLogRepository.log(
        {
          entityName: entity,
          entityId: record.id,
          action,
          values,
        },
        this.options,
      )
    }
  }

  protected async populateRelationsForRows(rows: any[]): Promise<any[]> {
    return Promise.all(rows.map((r) => this.populateRelations(r)))
  }

  protected async populateRelations(record: any): Promise<any> {
    if (!record) return record

    return record.get({ plain: true })
  }
}
