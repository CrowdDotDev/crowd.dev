/* eslint-disable no-continue */
import { Error404 } from '@crowd/common'
import {
  OrganizationField,
  cleanSoftDeletedMemberOrganization,
  createMemberOrganization,
  deleteMemberOrganization,
  fetchMemberOrganizations,
  optionsQx,
  queryOrgs,
  updateMemberOrganization,
} from '@crowd/data-access-layer'
import { findOverrides as findMemberOrganizationAffiliationOverrides } from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization, IOrganization, IRenderFriendlyMemberOrganization } from '@crowd/types'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { CommonMemberService } from '../../../../services/libs/common_services/src/services/common.member.service'
import { IServiceOptions } from '../IServiceOptions'

type IOrganizationSummary = Pick<IOrganization, 'id' | 'displayName' | 'logo'>

export default class MemberOrganizationsService extends LoggerBase {
  options: IServiceOptions

  private readonly commonMemberService: CommonMemberService

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
    this.commonMemberService = new CommonMemberService(
      optionsQx(options),
      options.temporal,
      options.log,
    )
  }

  // Member organization list
  async list(memberId: string): Promise<IRenderFriendlyMemberOrganization[]> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)

    // Fetch member organizations
    const memberOrganizations: IMemberOrganization[] = await fetchMemberOrganizations(qx, memberId)

    if (memberOrganizations.length === 0) {
      return []
    }

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
    return memberOrganizations.map((mo) => ({
      ...(orgByid[mo.organizationId] || {}),
      id: mo.organizationId,
      memberOrganizations: {
        ...mo,
        affiliationOverride: affiliationOverrides.find((ao) => ao.memberOrganizationId === mo.id),
      },
    }))
  }

  // Member organization creation
  async create(
    memberId: string,
    data: Partial<IMemberOrganization>,
  ): Promise<IRenderFriendlyMemberOrganization[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const repositoryOptions = { ...this.options, transaction }

    try {
      const qx = SequelizeRepository.getQueryExecutor(repositoryOptions)

      // Clean up any soft-deleted entries
      await cleanSoftDeletedMemberOrganization(qx, memberId, data.organizationId, data)

      // Create new member organization
      await createMemberOrganization(qx, memberId, data)

      // Start affiliation recalculation within the same transaction
      await this.commonMemberService.startAffiliationRecalculation(memberId, [data.organizationId])

      // Fetch updated list
      const result = await this.list(memberId)

      await SequelizeRepository.commitTransaction(transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  // Update member organization
  async update(
    id: string,
    memberId: string,
    data: Partial<IMemberOrganization>,
  ): Promise<IRenderFriendlyMemberOrganization[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const repositoryOptions = { ...this.options, transaction }

    try {
      const qx = SequelizeRepository.getQueryExecutor(repositoryOptions)

      await cleanSoftDeletedMemberOrganization(qx, memberId, data.organizationId, data)
      await updateMemberOrganization(qx, memberId, id, data)

      await this.commonMemberService.startAffiliationRecalculation(memberId, [data.organizationId])

      const result = await this.list(memberId)

      await SequelizeRepository.commitTransaction(transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  // Delete member organization
  async delete(id: string, memberId: string): Promise<IRenderFriendlyMemberOrganization[]> {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const repositoryOptions = { ...this.options, transaction }

    try {
      const qx = SequelizeRepository.getQueryExecutor(repositoryOptions)

      const existingMemberOrganizations = await fetchMemberOrganizations(qx, memberId)
      const memberOrganizationToBeDeleted = existingMemberOrganizations.find((mo) => mo.id === id)

      if (!memberOrganizationToBeDeleted) {
        throw new Error404(`Member organization with id ${id} not found!`)
      }

      await deleteMemberOrganization(qx, memberId, id)

      await this.commonMemberService.startAffiliationRecalculation(
        memberId,
        [memberOrganizationToBeDeleted.organizationId],
        true,
      )

      const result = await this.list(memberId)

      await SequelizeRepository.commitTransaction(transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }
}
