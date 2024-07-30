import Sequelize, { QueryTypes } from 'sequelize'

import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberIdentityRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    return qx.select(
        `
            SELECT mi.id, mi.platform, mi."sourceId", mi.type, mi.value, mi.verified
            FROM "memberIdentities" as mi
            WHERE "memberId" = $(memberId)
        `,
        {
          memberId,
        },
    )
  }

  static async create(data, options: IRepositoryOptions) {
    return data
  }

  static async update(data, options: IRepositoryOptions) {
    return data
  }

  static async delete(data, options: IRepositoryOptions) {
    return data
  }
}

export default MemberIdentityRepository
