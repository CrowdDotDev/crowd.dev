/* eslint-disable no-continue */
import * as lodash from 'lodash'

import { captureApiChange, memberEditProfileAction } from '@crowd/audit-logs'
import { Error404 } from '@crowd/common'
import {
  fetchMemberAttributes,
  getMemberManuallyChangedFields,
  setMemberManuallyChangedFields,
  updateMemberAttributes,
} from '@crowd/data-access-layer/src/members'
import { LoggerBase } from '@crowd/logging'
import { IAttributes } from '@crowd/types'

import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from '../IServiceOptions'

export default class MemberAttributesService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async list(memberId: string): Promise<IAttributes> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    const result = await fetchMemberAttributes(qx, memberId)
    if (!result) {
      throw new Error404('Attributes not found for the given member!')
    }

    return result
  }

  // Update member attributes
  async update(memberId: string, data: IAttributes): Promise<IAttributes> {
    return captureApiChange(
      this.options,
      memberEditProfileAction(memberId, async (captureOldState, captureNewState) => {
        const repoOptions: IRepositoryOptions =
          await SequelizeRepository.createTransactionalRepositoryOptions(this.options)

        const tx = repoOptions.transaction
        const qx = SequelizeRepository.getQueryExecutor(repoOptions, tx)

        try {
          const currentMemberAttributes = await fetchMemberAttributes(qx, memberId)

          if (!currentMemberAttributes) {
            throw new Error404('Attributes not found for the given member during update!')
          }

          captureOldState({ attributes: currentMemberAttributes })

          const existingManuallyChangedFields =
            (await getMemberManuallyChangedFields(qx, memberId)) || []

          const updatedManuallyChangedFields = [...existingManuallyChangedFields]

          for (const key of Object.keys(data)) {
            if (
              !currentMemberAttributes[key] ||
              !lodash.isEqual(currentMemberAttributes[key].default, data[key].default)
            ) {
              const fieldName = `attributes.${key}`
              if (!updatedManuallyChangedFields.includes(fieldName)) {
                updatedManuallyChangedFields.push(fieldName)
              }
            }
          }

          await updateMemberAttributes(qx, memberId, data)

          await setMemberManuallyChangedFields(qx, memberId, updatedManuallyChangedFields)

          const updatedAttributes = await fetchMemberAttributes(qx, memberId)

          captureNewState({ attributes: updatedAttributes })

          await SequelizeRepository.commitTransaction(tx)

          return updatedAttributes
        } catch (error) {
          await SequelizeRepository.rollbackTransaction(tx)
          throw error
        }
      }),
    )
  }
}
