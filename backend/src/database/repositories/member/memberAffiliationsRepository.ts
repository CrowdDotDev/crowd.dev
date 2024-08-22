import { fetchMemberAffiliations } from '@crowd/data-access-layer/src/members/affiliations'
import { IMemberAffiliation } from '@crowd/types'
import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberAffiliationsRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const qx = SequelizeRepository.getQueryExecutor(options)

    // list member affiliations
    return fetchMemberAffiliations(qx, memberId)
  }

  static async upsertMultiple(
    tenantId: string,
    memberId: string,
    data: Partial<IMemberAffiliation>[],
    options: IRepositoryOptions,
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Create member identities
      // for (const identity of data) {
      //   await createMemberIdentity(qx, tenantId, memberId, identity)
      // }

      // List all member identities
      const list = await fetchMemberAffiliations(qx, memberId)

      await SequelizeRepository.commitTransaction(transaction)

      return list
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }
}

export default MemberAffiliationsRepository
