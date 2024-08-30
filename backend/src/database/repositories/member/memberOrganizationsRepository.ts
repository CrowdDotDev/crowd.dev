import { IMemberOrganization, IOrganization } from '@crowd/types'
import {
  cleanSoftDeletedMemberOrganization,
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
    const qx = SequelizeRepository.getQueryExecutor(options)

    // Hard delete any existing soft-deleted member organization to prevent conflict errors
    // when adding a similar entry.
    await cleanSoftDeletedMemberOrganization(qx, memberId, data.organizationId, data)

    // Create member organization
    await createMemberOrganization(qx, memberId, data)

    // List all member organizations
    return this.list(memberId, options)
  }

  static async update(
    id: string,
    memberId: string,
    data: Partial<IMemberOrganization>,
    options: IRepositoryOptions,
  ) {
    const qx = SequelizeRepository.getQueryExecutor(options)

    // Hard delete any existing soft-deleted member organization to prevent conflict errors
    // when updating a similar entry.
    await cleanSoftDeletedMemberOrganization(qx, memberId, data.organizationId, data)

    // Update member organization
    await updateMemberOrganization(qx, memberId, id, data)

    // List all member organizations
    return this.list(memberId, options)
  }

  static async delete(id: string, memberId: string, options: IRepositoryOptions) {
    const qx = SequelizeRepository.getQueryExecutor(options)

    // Delete organization
    await deleteMemberOrganization(qx, memberId, id)

    // List all member organizations
    return this.list(memberId, options)
  }
}

export default MemberOrganizationsRepository
