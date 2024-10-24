import {
  fetchMembersWithoutWorkExperience,
  fetchMembersWithTooManyIdentities,
  fetchMembersWithTooManyIdentitiesPerPlatform,
} from '@crowd/data-access-layer/src/data-quality'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

class DataQualityRepository {
  /**
   * Finds members with no work experience.
   *
   * @param {IRepositoryOptions} options - The repository options for executing the query.
   * @param {string} tenantId - The ID of the tenant.
   * @param {number} limit - The maximum number of results to return.
   * @param {number} offset - The offset from which to begin returning results.
   * @param {string} segmentId - The ID of the segment.
   * @return {Promise<Members[]>} - A promise that resolves with an array of members having no work experience.
   */
  static async findMembersWithNoWorkExperience(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithoutWorkExperience(qx, tenantId, limit, offset, segmentId)
  }

  static async findMembersWithTooManyIdentities(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithTooManyIdentities(qx, 10, tenantId, limit, offset, segmentId)
  }

  static async findMembersWithTooManyIdentitiesPerPlatform(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithTooManyIdentitiesPerPlatform(qx, 1, tenantId, limit, offset, segmentId)
  }
}

export default DataQualityRepository
