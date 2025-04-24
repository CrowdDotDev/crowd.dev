/* eslint-disable no-continue */
import lodash from 'lodash'

import { captureApiChange, memberEditIdentitiesAction, memberUserValidationAction } from '@crowd/audit-logs'
import { Error409 } from '@crowd/common'
import {
  checkIdentityExistance,
  createMemberIdentity,
  deleteMemberIdentity,
  fetchMemberIdentities,
  findMemberIdentityById,
  touchMemberUpdatedAt,
  updateMemberIdentity,
  createMemberUserValidation,
  getMemberUserValidations,
} from '@crowd/data-access-layer/src/members'
import { LoggerBase } from '@crowd/logging'
import { IMemberIdentity, IMemberIdentityUserValidationDetails, IMemberIdentityWithActivityCount, IMemberUserValidationInput, MemberIdentityType, MemberUserValidationType } from '@crowd/types'

import { getActivityCountOfMemberIdentities } from '@crowd/data-access-layer'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import MemberRepository from '@/database/repositories/memberRepository'
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

  /**
   * Returns a list of detected identities with activity count
   * @warning This method is used by external systems
   */
  async detectedList(memberId: string): Promise<IMemberIdentityWithActivityCount[]> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    
    // Fetch all identities
    const [identities, validated] = await Promise.all([
      fetchMemberIdentities(
        qx,
        memberId,
        { verified: true },
        ['id', 'platform', 'type', 'value']
      ),
      getMemberUserValidations(qx, memberId, {
        type: MemberUserValidationType.IDENTITY,
      }),
    ])

    this.options.log.info('validated', validated)

    const validatedIdentityIds = validated.map((r) => r.details.identityId)

    // Filter out identities that were previously validated
    const filteredIdentities = identities.filter(
      (identity) => !validatedIdentityIds.includes(identity.id)
    )

    // Only username identities for activity count
    const usernameIdentities = filteredIdentities.filter(
      (identity) => identity.type === MemberIdentityType.USERNAME
    )

    // Get activity count map per username identity
    const activityMap = await getActivityCountOfMemberIdentities(this.options.qdb, memberId, usernameIdentities, true)

    return filteredIdentities.map((identity) => ({
      ...identity,
      ...(identity.type === MemberIdentityType.USERNAME && {
        activityCount: activityMap[`${identity.platform}:${identity.value}`] || 0,
      }),
    }))
  }

  async userValidation(memberId: string, data: IMemberUserValidationInput<IMemberIdentityUserValidationDetails>): Promise<void> {  
    try {
      const qx = SequelizeRepository.getQueryExecutor(this.options)
      const result = await createMemberUserValidation(qx, memberId, {
        type: MemberUserValidationType.IDENTITY,
        ...data
      })
      
      // record changes for audit logs
      await captureApiChange(
        this.options,
        memberUserValidationAction(memberId, async (captureState) => {
          captureState(result)
        }),
      )
    } catch (error) {
      this.log.error(error)
      throw error
    }
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

          const memberIdentities = (await MemberRepository.getIdentities([memberId], repoOptions))
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

          const memberIdentities = (await MemberRepository.getIdentities([memberId], repoOptions))
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

          const memberIdentities = (await MemberRepository.getIdentities([memberId], repoOptions))
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
