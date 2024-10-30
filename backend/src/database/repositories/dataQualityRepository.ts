import {
  fetchMembersWithConflictingWorkExperiences,
  fetchMembersWithMissingInfoOnWorkExperience,
  fetchMembersWithMissingPeriodOnWorkExperience,
  fetchMembersWithTooManyEmails,
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
    return fetchMembersWithTooManyIdentities(qx, 20, tenantId, limit, offset, segmentId)
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

  /**
   * Finds members who have too many emails within a given tenant and segment.
   *
   * @param {IRepositoryOptions} options - The repository options containing configuration and context for the query.
   * @param {string} tenantId - The identifier for the tenant where members are queried.
   * @param {number} limit - The maximum number of members to return.
   * @param {number} offset - The starting point for pagination.
   * @param {string} segmentId - The identifier for the segment to filter members.
   * @return {Promise<Array>} - A promise that resolves to an array of members who have too many emails.
   */
  static async findMembersWithTooManyEmails(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithTooManyEmails(qx, 5, tenantId, limit, offset, segmentId)
  }

  /**
   * Finds members with missing information on work experience.
   *
   * @param {IRepositoryOptions} options - The repository options to be used.
   * @param {string} tenantId - The unique identifier of the tenant.
   * @param {number} limit - The maximum number of records to fetch.
   * @param {number} offset - The number of records to skip.
   * @param {string} segmentId - The segment identifier to be used for filtering.
   * @return {Promise<Array>} A promise that resolves to an array of members with missing work experience information.
   */
  static async findMembersWithMissingInfoOnWorkExperience(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithMissingInfoOnWorkExperience(qx, tenantId, limit, offset, segmentId)
  }

  /**
   * Fetches members whose work experience period is missing.
   *
   * @param {IRepositoryOptions} options - The repository options for database access.
   * @param {string} tenantId - The ID of the tenant to find members for.
   * @param {number} limit - The maximum number of members to return.
   * @param {number} offset - The offset to start fetching members from.
   * @param {string} segmentId - The ID of the segment to filter members.
   * @return {Promise<Member[]>} A promise that resolves to an array of members with missing work experience periods.
   */
  static async findMembersWithMissingPeriodOnWorkExperience(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithMissingPeriodOnWorkExperience(qx, tenantId, limit, offset, segmentId)
  }

  /**
   * Finds members with conflicting work experience based on specified options.
   *
   * @param {IRepositoryOptions} options - The repository options for database query execution.
   * @param {string} tenantId - The ID of the tenant to filter members.
   * @param {number} limit - The maximum number of records to fetch.
   * @param {number} offset - The number of records to skip for pagination.
   * @param {string} segmentId - The ID of the segment to filter members.
   * @return {Promise<Array>} - A promise that resolves to an array of members with conflicting work experiences.
   */
  static async findMembersWithConflictingWorkExperience(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
    segmentId: string,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithConflictingWorkExperiences(qx, tenantId, limit, offset, segmentId)
  }
}

export default DataQualityRepository
