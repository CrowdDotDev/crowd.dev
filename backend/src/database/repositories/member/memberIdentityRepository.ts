import { IMemberIdentity } from '@crowd/types'
import {
  checkIdentityExistance,
  createMemberIdentity,
  deleteMemberIdentity,
  fetchMemberIdentities,
  findMemberIdentityById,
  updateMemberIdentity,
} from '@crowd/data-access-layer/src/members'
import { Error409 } from '@crowd/common'
import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberIdentityRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    // List all member identities
    return fetchMemberIdentities(qx, memberId)
  }

  static async create(
    tenantId: string,
    memberId: string,
    data: Partial<IMemberIdentity>,
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    // Check if identity already exists
    const existingIdentities = await checkIdentityExistance(qx, data.value, data.platform)
    if (existingIdentities.length > 0) {
      throw new Error409(
        options.language,
        'errors.alreadyExists',
        // @ts-ignore
        JSON.stringify({
          memberId: existingIdentities[0].memberId,
        }),
      )
    }

    // Create member identity
    await createMemberIdentity(qx, tenantId, memberId, data)

    // List all member identities
    return fetchMemberIdentities(qx, memberId)
  }

  static async findById(memberId: string, id: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    // Create member identity
    return findMemberIdentityById(qx, memberId, id)
  }

  static async createMultiple(
    tenantId: string,
    memberId: string,
    data: Partial<IMemberIdentity>[],
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    // Check if any of the identities already exist
    for (const identity of data) {
      const existingIdentities = await checkIdentityExistance(qx, identity.value, identity.platform)

      if (existingIdentities.length > 0) {
        throw new Error409(
          options.language,
          'errors.alreadyExists',
          // @ts-ignore
          JSON.stringify({
            memberId: existingIdentities[0].memberId,
          }),
        )
      }
    }

    // Create member identities
    for (const identity of data) {
      await createMemberIdentity(qx, tenantId, memberId, identity)
    }

    // List all member identities
    return fetchMemberIdentities(qx, memberId)
  }

  static async update(
    id: string,
    memberId: string,
    data: Partial<IMemberIdentity>,
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    // Check if identity already exists
    const existingIdentities = await checkIdentityExistance(qx, data.value, data.platform)
    const filteredExistingIdentities = existingIdentities.filter((i) => i.id !== id)
    if (filteredExistingIdentities.length > 0) {
      throw new Error409(
        options.language,
        'errors.alreadyExists',
        // @ts-ignore
        JSON.stringify({
          memberId: filteredExistingIdentities[0].memberId,
        }),
      )
    }

    // Update member identity with new data
    await updateMemberIdentity(qx, memberId, id, data)

    // List all member identities
    return fetchMemberIdentities(qx, memberId)
  }

  static async delete(id: string, memberId: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const qx = SequelizeRepository.getQueryExecutor(options, transaction)

    // Delete member identity
    await deleteMemberIdentity(qx, memberId, id)

    // List all member identities
    return fetchMemberIdentities(qx, memberId)
  }
}

export default MemberIdentityRepository