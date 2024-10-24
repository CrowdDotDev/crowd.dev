/* eslint-disable no-continue */
import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import { IDataQualityParams, IDataQualityType } from '@/types/data-quality/data-quality-filters'
import DataQualityRepository from '@/database/repositories/dataQualityRepository'

export default class DataQualityService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

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
    if (params.type === IDataQualityType.MORE_THAN_10_IDENTITIES) {
      return DataQualityRepository.findMembersWithTooManyIdentities(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    if (params.type === IDataQualityType.MORE_THAN_1_IDENTITY_PER_PLATFORM) {
      return DataQualityRepository.findMembersWithTooManyIdentitiesPerPlatform(
        this.options,
        tenantId,
        params.limit || 10,
        params.offset || 0,
        segmentId,
      )
    }
    return []
  }

  // eslint-disable-next-line class-methods-use-this
  async findOrganizationIssues() {
    return Promise.resolve([])
  }
}
