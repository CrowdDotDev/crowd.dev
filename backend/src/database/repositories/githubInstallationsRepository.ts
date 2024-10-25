import { QueryTypes } from 'sequelize'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class GithubInstallationsRepository {
  static async getInstallations(options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    return seq.query(
      `
       select * from "githubInstallations"
      `,
      {
        transaction,
        type: QueryTypes.SELECT,
      },
    )
  }
}
