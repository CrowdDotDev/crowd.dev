/* eslint-disable no-continue */
import { LoggerBase } from '@crowd/logging'
import { IAttributes } from '@crowd/types'
import * as lodash from 'lodash'

import { captureApiChange, memberEditProfileAction } from '@crowd/audit-logs'
import { Error404 } from '@crowd/common'
import { fetchMemberAttributes, getMemberManuallyChangedFields, setMemberManuallyChangedFields, updateMemberAttributes } from '@crowd/data-access-layer/src/members'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from '../IServiceOptions'

export default class MemberAttributesService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  // Member attributes
  async list(memberId: string): Promise<IAttributes> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    // Get member attributes
    const result = await fetchMemberAttributes(qx, memberId)
    if (!result.length) {
      throw new Error404('Attributes not found for the given member!')
    }

    return result
  }

  // Update member attributes
  async update(memberId: string, data: IAttributes): Promise<IAttributes> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    const currentMemberAttributes = await fetchMemberAttributes(qx, memberId)
    if (!currentMemberAttributes) {
      throw new Error404('Attributes not found for the given member!')
    }

    const existingManuallyChangedFields = (await getMemberManuallyChangedFields(qx, memberId)) || []

    const updatedManuallyChangedFields = [...existingManuallyChangedFields]

    const result = await captureApiChange(
      this.options,
      memberEditProfileAction(memberId, async (captureOldState, captureNewState) => {
        captureOldState({ attributes: currentMemberAttributes })

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

        captureNewState({ attributes: data })

        // Get updated member attributes
        return fetchMemberAttributes(qx, memberId)
      }),
    )

    return result
  }
}
