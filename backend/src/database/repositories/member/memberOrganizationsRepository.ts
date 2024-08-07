import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'
import {IMemberIdentity, IMemberOrganization} from "@crowd/types";

class MemberOrganizationsRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = {...options, transaction}
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      console.log(qx)
      // List all member identities
      await SequelizeRepository.commitTransaction(transaction)

    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async create(
      tenantId: string,
      memberId: string,
      data: Partial<IMemberOrganization>,
      options: IRepositoryOptions,
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = {...options, transaction}
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      console.log(qx)
      // List all member identities
      await SequelizeRepository.commitTransaction(transaction)

    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async findById(memberId: string, id: string, options: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = {...options, transaction}
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      console.log(qx)
      // List all member identities
      await SequelizeRepository.commitTransaction(transaction)

    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }


  static async update(
      id: string,
      memberId: string,
      data: Partial<IMemberOrganization>,
      options: IRepositoryOptions,
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = {...options, transaction}
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      console.log(qx)
      // List all member identities
      await SequelizeRepository.commitTransaction(transaction)

    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async delete(id: string, memberId: string, options: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = {...options, transaction}
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      console.log(qx)
      // List all member identities
      await SequelizeRepository.commitTransaction(transaction)

    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }
}

export default MemberOrganizationsRepository
