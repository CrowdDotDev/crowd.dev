/* eslint-disable no-continue */
import { LoggerBase } from '@crowd/logging'

import DataQualityRepository from '@/database/repositories/dataQualityRepository'
import { IDataQualityParams, IDataQualityType } from '@/types/data-quality/data-quality-filters'

import { IServiceOptions } from './IServiceOptions'

export default class DataQualityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  /**
   * Finds issues related to member data quality based on the specified type.
   *
   * @param {string} tenantId - The ID of the tenant for whom to find member issues.
   * @param {IDataQualityParams} params - The parameters for finding member issues, including the type of issue, limit, and offset.
   * @param {string} segmentId - The ID of the segment where the members belong.
   * @return {Promise<Array>} A promise that resolves to an array of members with the specified data quality issues.
   */
  async findMemberIssues(tenantId: string, params: IDataQualityParams, segmentId: string) {
    const methodMap = {
      [IDataQualityType.NO_WORK_EXPERIENCE]: DataQualityRepository.findMembersWithNoWorkExperience,
      [IDataQualityType.TOO_MANY_IDENTITIES]:
        DataQualityRepository.findMembersWithTooManyIdentities,
      [IDataQualityType.TOO_MANY_IDENTITIES_PER_PLATFORM]:
        DataQualityRepository.findMembersWithTooManyIdentitiesPerPlatform,
      [IDataQualityType.TOO_MANY_EMAILS]: DataQualityRepository.findMembersWithTooManyEmails,
      [IDataQualityType.WORK_EXPERIENCE_MISSING_INFO]:
        DataQualityRepository.findMembersWithMissingInfoOnWorkExperience,
      [IDataQualityType.WORK_EXPERIENCE_MISSING_PERIOD]:
        DataQualityRepository.findMembersWithMissingPeriodOnWorkExperience,
      [IDataQualityType.CONFLICTING_WORK_EXPERIENCE]:
        DataQualityRepository.findMembersWithConflictingWorkExperience,
    }

    const method = methodMap[params.type]

    if (method) {
      return method(this.options, tenantId, params.limit || 10, params.offset || 0, segmentId)
    }
    return []
  }

  // TODO: Implement this method when there are checks available
  // eslint-disable-next-line class-methods-use-this
  async findOrganizationIssues() {
    return Promise.resolve([])
  }
}
