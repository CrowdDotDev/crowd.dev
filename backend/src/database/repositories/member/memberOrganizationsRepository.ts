import { IMemberOrganization, IOrganization } from '@crowd/types'
import {
  createMemberOrganization,
  deleteMemberOrganization,
  fetchMemberOrganizations,
  updateMemberOrganization,
} from '@crowd/data-access-layer/src/members'
import { OrganizationField, queryOrgs } from '@crowd/data-access-layer/src/orgs'
import SequelizeRepository from '../sequelizeRepository'
import { IRepositoryOptions } from '../IRepositoryOptions'

class MemberOrganizationsRepository {
  static async list(memberId: string, options: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Fetch member organizations
      const memberOrganizations: IMemberOrganization[] = await fetchMemberOrganizations(
        qx,
        memberId,
      )

      // Parse unique organization ids
      const orgIds: string[] = [...new Set(memberOrganizations.map((mo) => mo.organizationId))]

      // Fetch organizations
      let organizations: IOrganization[] = []
      if (orgIds.length) {
        organizations = await queryOrgs(qx, {
          filter: {
            [OrganizationField.ID]: {
              in: orgIds,
            },
          },
          fields: [OrganizationField.ID, OrganizationField.DISPLAY_NAME, OrganizationField.LOGO],
        })
      }

      // Create mapping by id to speed up the processing
      const orgByid: Record<string, IOrganization> = organizations.reduce(
        (obj: Record<string, IOrganization>, org) => ({
          ...obj,
          [org.id]: org,
        }),
        {},
      )

      // Format the results
      const result = memberOrganizations.map((mo) => ({
        ...(orgByid[mo.organizationId] || {}),
        id: mo.organizationId,
        memberOrganizations: mo,
      }))

      await SequelizeRepository.commitTransaction(transaction)

      return result
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async create(
    memberId: string,
    data: Partial<IMemberOrganization>,
    options: IRepositoryOptions,
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Create member organization
      await createMemberOrganization(qx, memberId, data)

      await SequelizeRepository.commitTransaction(transaction)

      // List all member organizations
      return await this.list(memberId, options)
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async update(
    id: string,
    memberId: string,
    data: Partial<IMemberOrganization>,
    options: IRepositoryOptions,
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Update member organization
      await updateMemberOrganization(qx, memberId, id, data)

      await SequelizeRepository.commitTransaction(transaction)

      // List all member organizations
      return await this.list(memberId, options)
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }

  static async delete(id: string, memberId: string, options: IRepositoryOptions) {
    const transaction = await SequelizeRepository.createTransaction(options)
    try {
      const txOptions = { ...options, transaction }
      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      // Delete organization
      await deleteMemberOrganization(qx, memberId, id)

      await SequelizeRepository.commitTransaction(transaction)

      // List all member organizations
      return await this.list(memberId, options)
    } catch (err) {
      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }
      throw err
    }
  }
}

export default MemberOrganizationsRepository
