import {
  fetchMembersWithoutWorkExperience,
  fetchMembersWithTooManyIdentities,
  fetchMembersWithTooManyIdentitiesPerPlatform,
} from '@crowd/data-access-layer/src/data-quality'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

class DataQualityRepository {
  static async findMembersWithNoWorkExperience(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithoutWorkExperience(qx, tenantId, limit, offset)
  }

  static async findMembersWithTooManyIdentities(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithTooManyIdentities(qx, 10, tenantId, limit, offset)
  }

  static async findMembersWithTooManyIdentitiesPerPlatform(
    options: IRepositoryOptions,
    tenantId: string,
    limit: number,
    offset: number,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)
    return fetchMembersWithTooManyIdentitiesPerPlatform(qx, 1, tenantId, limit, offset)
  }
}

export default DataQualityRepository
