import { findOverrides as findMemberOrganizationAffiliationOverrides } from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import {
  cleanSoftDeletedMemberOrganization,
  createMemberOrganization,
  deleteMemberOrganization,
  fetchMemberOrganizations,
  updateMemberOrganization,
} from '@crowd/data-access-layer/src/members'
import { OrganizationField, queryOrgs } from '@crowd/data-access-layer/src/orgs'
import { IMemberOrganization, IOrganization, IRenderFriendlyMemberOrganization } from '@crowd/types'

import { IRepositoryOptions } from '../IRepositoryOptions'
import SequelizeRepository from '../sequelizeRepository'

type IOrganizationSummary = Pick<IOrganization, 'id' | 'displayName' | 'logo'>

class MemberOrganizationsRepository {
  static async list(
    memberId: string,
    options: IRepositoryOptions,
  ): Promise<IRenderFriendlyMemberOrganization[]> {
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
      let organizations: IOrganizationSummary[] = []
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

      // Fetch affiliation overrides
      const affiliationOverrides = await findMemberOrganizationAffiliationOverrides(
        qx,
        memberId,
        memberOrganizations.map((mo) => mo.id),
      )

      // Create mapping by id to speed up the processing
      const orgByid: Record<string, IOrganizationSummary> = organizations.reduce(
        (obj: Record<string, IOrganizationSummary>, org) => ({
          ...obj,
          [org.id]: org,
        }),
        {},
      )

      // Format the results
      const result: IRenderFriendlyMemberOrganization[] = memberOrganizations.map((mo) => ({
        ...(orgByid[mo.organizationId] || {}),
        id: mo.organizationId,
        memberOrganizations: {
          ...mo,
          affiliationOverride: affiliationOverrides.find((ao) => ao.memberOrganizationId === mo.id),
        },
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
  ): Promise<IRenderFriendlyMemberOrganization[]> {
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
  ): Promise<IRenderFriendlyMemberOrganization[]> {
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
