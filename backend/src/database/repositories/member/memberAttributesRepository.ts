import { Error404 } from '@crowd/common'
import { fetchMemberAttributes, updateMemberAttributes } from '@crowd/data-access-layer/src/members'
import { IAttributes } from '@crowd/types'

import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberAttributesRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const qx = SequelizeRepository.getQueryExecutor(options)

    // Get member attributes
    const result = await fetchMemberAttributes(qx, memberId)
    if (!result.length) {
      throw new Error404('Member not found')
    }
    return result[0]?.attributes
  }

  static async update(memberId: string, data: IAttributes, options: IRepositoryOptions) {
    const qx = SequelizeRepository.getQueryExecutor(options)

    // Update member attributes
    await updateMemberAttributes(qx, memberId, data)

    // Get member attributes
    return this.list(memberId, options)
  }
}

export default MemberAttributesRepository
