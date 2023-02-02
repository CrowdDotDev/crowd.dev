import moment from 'moment'
import lodash from 'lodash'
import SequelizeRepository from './sequelizeRepository'
import Error404 from '../../errors/Error404'
import Error400 from '../../errors/Error400'
import AuditLogRepository from './auditLogRepository'
import { IRepositoryOptions } from './IRepositoryOptions'
import { EagleEyeContentData } from '../../types/eagleEyeTypes'

export default class EagleEyeContentRepository {
  /**
   * Create an eagle eye shown content record.
   * @param data Data to a new EagleEyeContent record.
   * @param options Repository options.
   * @returns Created EagleEyeContent record.
   */
  static async upsert(data:EagleEyeContentData, options: IRepositoryOptions): Promise<EagleEyeContentData> {

    if(!data.url){
      throw new Error(`Can't upsert without url`)
    }

    // find by url
    const existing = await EagleEyeContentRepository.findByUrl(data.url, options)

    let record

    if (existing){
      record  = await EagleEyeContentRepository.update(existing.id, data, options)
    }
    /*
    else{
      record = options.database.eagleEyeContent.create(
        {
          ...lodash.pick(data, [
            'platform',
            'post',
            'url',
          ]),
          memberId: data.member || null,
          parentId: data.parent || null,
          sourceParentId: data.sourceParentId || null,
          conversationId: data.conversationId || null,
          tenantId: tenant.id,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
        {
          transaction,
        },
      )
    }
    */

    

    return this.findById(record.id, options)
  }


  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.eagleEyeContent.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }


    record = await record.update(
      {
        ...lodash.pick(data, [
          'platform',
          'post',
          'url',
        ]),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    return this.findById(record.id, options)
  }

  static async findById(id:string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeContent.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  static async findByUrl(url:string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.eagleEyeContent.findOne({
      where: {
        url,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      return null
    }

    return this._populateRelations(record)
  }

  static async _populateRelationsForRows(rows) {
    if (!rows) {
      return rows
    }

    return Promise.all(rows.map((record) => this._populateRelations(record)))
  }

  static async _populateRelations(record) {
    if (!record) {
      return record
    }

    return record.get({ plain: true })
  }
}
