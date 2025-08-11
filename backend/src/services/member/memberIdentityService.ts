/* eslint-disable no-continue */
import lodash from 'lodash'

import { captureApiChange, memberEditIdentitiesAction } from '@crowd/audit-logs'
import { Error409 } from '@crowd/common'
import { optionsQx } from '@crowd/data-access-layer'
import { findIdentitiesForMembers } from '@crowd/data-access-layer/src/member_identities'
import {
  checkIdentityExistance,
  createMemberIdentity,
  deleteMemberIdentity,
  fetchMemberIdentities,
  findMemberIdentityById,
  touchMemberUpdatedAt,
  updateMemberIdentity,
} from '@crowd/data-access-layer/src/members'
import { LoggerBase } from '@crowd/logging'
import { IMemberIdentity } from '@crowd/types'

import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from '../IServiceOptions'

export default class MemberIdentityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  // Member identity list
  async list(memberId: string): Promise<IMemberIdentity[]> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    return fetchMemberIdentities(qx, memberId)
  }

  // Member identity creation
  async create(memberId: string, data: Partial<IMemberIdentity>): Promise<IMemberIdentity[]> {
    let tx

    const tenantId = SequelizeRepository.getCurrentTenant(this.options).id

    try {
      const list = await captureApiChange(
        this.options,
        memberEditIdentitiesAction(memberId, async (captureOldState, captureNewState) => {
          const repoOptions: IRepositoryOptions =
            await SequelizeRepository.createTransactionalRepositoryOptions(this.options)

          const memberIdentities = (
            await findIdentitiesForMembers(optionsQx(repoOptions), [memberId])
          )
            .get(memberId)
            .map((identity) => lodash.omit(identity, ['createdAt', 'integrationId']))

          captureOldState(lodash.sortBy(memberIdentities, [(i) => i.platform, (i) => i.type]))

          tx = repoOptions.transaction

          const qx = SequelizeRepository.getQueryExecutor(repoOptions, tx)

          // Check if identity already exists
          const existingIdentities = await checkIdentityExistance(qx, data.value, data.platform)
          if (existingIdentities.length > 0) {
            throw new Error409(
              this.options.language,
              'errors.alreadyExists',
              // @ts-ignore
              JSON.stringify({
                memberId: existingIdentities[0].memberId,
              }),
            )
          }

          // Create member identity
          await createMemberIdentity(qx, tenantId, memberId, data)

          await touchMemberUpdatedAt(qx, memberId)

          // List all member identities
          const list = await fetchMemberIdentities(qx, memberId)

          captureNewState(lodash.sortBy(list, [(i) => i.platform, (i) => i.type]))

          await SequelizeRepository.commitTransaction(tx)

          return list
        }),
      )

      return list
    } catch (error) {
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw error
    }
  }

  async findById(memberId: string, id: string): Promise<IMemberIdentity> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    return findMemberIdentityById(qx, memberId, id)
  }

  // Member multiple identity creation
  async createMultiple(
    memberId: string,
    data: Partial<IMemberIdentity>[],
  ): Promise<IMemberIdentity[]> {
    let tx
    const tenantId = SequelizeRepository.getCurrentTenant(this.options).id

    try {
      const list = await captureApiChange(
        this.options,
        memberEditIdentitiesAction(memberId, async (captureOldState, captureNewState) => {
          const repoOptions: IRepositoryOptions =
            await SequelizeRepository.createTransactionalRepositoryOptions(this.options)

          const memberIdentities = (
            await findIdentitiesForMembers(optionsQx(repoOptions), [memberId])
          )
            .get(memberId)
            .map((identity) => lodash.omit(identity, ['createdAt', 'integrationId']))

          captureOldState(lodash.sortBy(memberIdentities, [(i) => i.platform, (i) => i.type]))

          tx = repoOptions.transaction

          const qx = SequelizeRepository.getQueryExecutor(repoOptions, tx)

          // Check if any of the identities already exist
          for (const identity of data) {
            const existingIdentities = await checkIdentityExistance(
              qx,
              identity.value,
              identity.platform,
            )

            if (existingIdentities.length > 0) {
              throw new Error409(
                this.options.language,
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

          await touchMemberUpdatedAt(qx, memberId)

          // List all member identities
          const list = await fetchMemberIdentities(qx, memberId)

          captureNewState(lodash.sortBy(list, [(i) => i.platform, (i) => i.type]))

          await SequelizeRepository.commitTransaction(tx)

          return list
        }),
      )

      return list
    } catch (error) {
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw error
    }
  }

  // Update member identity
  async update(
    id: string,
    memberId: string,
    data: Partial<IMemberIdentity>,
  ): Promise<IMemberIdentity[]> {
    let tx

    try {
      const list = await captureApiChange(
        this.options,
        memberEditIdentitiesAction(memberId, async (captureOldState, captureNewState) => {
          const repoOptions: IRepositoryOptions =
            await SequelizeRepository.createTransactionalRepositoryOptions(this.options)

          const memberIdentities = (
            await findIdentitiesForMembers(optionsQx(repoOptions), [memberId])
          )
            .get(memberId)
            .map((identity) => lodash.omit(identity, ['createdAt', 'integrationId']))

          captureOldState(lodash.sortBy(memberIdentities, [(i) => i.platform, (i) => i.type]))

          tx = repoOptions.transaction

          const qx = SequelizeRepository.getQueryExecutor(repoOptions, tx)

          // Check if identity already exists
          const existingIdentities = await checkIdentityExistance(qx, data.value, data.platform)
          const filteredExistingIdentities = existingIdentities.filter((i) => i.id !== id)
          if (filteredExistingIdentities.length > 0) {
            throw new Error409(
              this.options.language,
              'errors.alreadyExists',
              // @ts-ignore
              JSON.stringify({
                memberId: filteredExistingIdentities[0].memberId,
              }),
            )
          }

          // Update member identity with new data
          await updateMemberIdentity(qx, memberId, id, data)

          await touchMemberUpdatedAt(qx, memberId)

          // List all member identities
          const list = await fetchMemberIdentities(qx, memberId)

          captureNewState(lodash.sortBy(list, [(i) => i.platform, (i) => i.type]))

          await SequelizeRepository.commitTransaction(tx)

          return list
        }),
      )

      return list
    } catch (error) {
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw error
    }
  }

  // Delete member identity
  async delete(id: string, memberId: string): Promise<IMemberIdentity[]> {
    let tx

    try {
      const repoOptions: IRepositoryOptions =
        await SequelizeRepository.createTransactionalRepositoryOptions(this.options)

      tx = repoOptions.transaction

      const qx = SequelizeRepository.getQueryExecutor(repoOptions, tx)

      // Delete member identity
      await deleteMemberIdentity(qx, memberId, id)

      await touchMemberUpdatedAt(qx, memberId)

      // List all member identities
      const list = await fetchMemberIdentities(qx, memberId)

      await SequelizeRepository.commitTransaction(tx)

      return list
    } catch (error) {
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }
      throw error
    }
  }
}
