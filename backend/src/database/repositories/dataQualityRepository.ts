import {
  fetchMembersWithTooManyIdentities,
  fetchMembersWithTooManyIdentitiesPerPlatform,
  fetchMembersWithoutWorkExperience,
} from '@crowd/data-access-layer/src/data-quality'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IRepositoryOptions } from './IRepositoryOptions'

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

  /**
   * Finds and returns members with too many identities.
   * Executes a query to fetch members who exceed a certain number of identities.
   *
   * @param {IRepositoryOptions} options - Repository options for querying the database.
   * @param {string} tenantId - Identifier of the tenant whose members are being queried.
   * @param {number} limit - The maximum number of members to retrieve.
   * @param {number} offset - The number of members to skip before starting to collect the result set.
   * @param {string} segmentId - Identifier of the segment to filter members.
   * @return {Promise<Array>} A promise that resolves to an array of members with too many identities.
   */
  static async findMembersWithTooManyIdentities(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithTooManyIdentities(qx, 15, tenantId, limit, offset, segmentId)
  }

  /**
   * Finds members with too many identities per platform.
   *
   * @param {IRepositoryOptions} options - The repository options for database connection and other configurations.
   * @param {string} tenantId - The ID of the tenant to filter members by.
   * @param {number} limit - The maximum number of members to return.
   * @param {number} offset - The number of members to skip before starting to collect the result set.
   * @param {string} segmentId - The ID of the segment to filter members by.
   *
   * @return {Promise<Array>} A promise that resolves to an array of members with too many identities per platform.
   */
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
