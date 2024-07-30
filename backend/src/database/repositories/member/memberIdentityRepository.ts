import {IMemberIdentity} from "@crowd/types"
import {
    createMemberIdentity,
    deleteMemberIdentity,
    fetchMemberIdentities,
    updateMemberIdentity
} from "@crowd/data-access-layer/src/members"
import {IRepositoryOptions} from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

class MemberIdentityRepository {
    static async list(memberId: string, options: IRepositoryOptions) {
        const transaction = SequelizeRepository.getTransaction(options)
        const qx = SequelizeRepository.getQueryExecutor(options, transaction)

        // List all member identities
        return fetchMemberIdentities(qx, memberId)
    }

    static async create(memberId: string, data: Partial<IMemberIdentity>, options: IRepositoryOptions) {
        const transaction = SequelizeRepository.getTransaction(options)
        const qx = SequelizeRepository.getQueryExecutor(options, transaction)

        // Create member identity
        await createMemberIdentity(qx, memberId, data)

        // List all member identities
        return fetchMemberIdentities(qx, memberId)
    }

    static async update(id: string, memberId: string, data: Partial<IMemberIdentity>, options: IRepositoryOptions) {
        const transaction = SequelizeRepository.getTransaction(options)
        const qx = SequelizeRepository.getQueryExecutor(options, transaction)

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
