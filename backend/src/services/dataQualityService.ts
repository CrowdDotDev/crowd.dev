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
   * Finds member issues based on the specified data quality parameters and segment ID.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @param {IDataQualityParams} params - The parameters for data quality filtering.
   * @param {string} segmentId - The ID of the segment to filter the members.
   * @return {Promise<Array>} A promise that resolves to an array of members with issues.
   */
  async findMemberIssues(tenantId: string, params: IDataQualityParams, segmentId: string) {
    if (params.type === IDataQualityType.NO_WORK_EXPERIENCE) {
      return DataQualityRepository.findMembersWithNoWorkExperience(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    if (params.type === IDataQualityType.TOO_MANY_IDENTITIES) {
      return DataQualityRepository.findMembersWithTooManyIdentities(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    if (params.type === IDataQualityType.TOO_MANY_IDENTITIES_PER_PLATFORM) {
      return DataQualityRepository.findMembersWithTooManyIdentitiesPerPlatform(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    if (params.type === IDataQualityType.TOO_MANY_EMAILS) {
      return DataQualityRepository.findMembersWithTooManyEmails(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    if (params.type === IDataQualityType.INCOMPLETE_WORK_EXPERIENCE) {
      return DataQualityRepository.findMembersWithIncompleteWorkExperience(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    return []
  }

  // TODO: Implement this method when there are checks available
  // eslint-disable-next-line class-methods-use-this
  async findOrganizationIssues() {
    return Promise.resolve([])
  }
}
