/* eslint-disable no-continue */
import { Error404 } from '@crowd/common'
import {
  OrganizationField,
  cleanSoftDeletedMemberOrganization,
  createMemberOrganization,
  createMemberUserValidation,
  deleteMemberOrganization,
  fetchMemberOrganizations,
  getMemberOrganizationStatus,
  queryOrgs,
  updateMemberOrganization,
} from '@crowd/data-access-layer'
import { findOverrides as findMemberOrganizationAffiliationOverrides } from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import { LoggerBase } from '@crowd/logging'
import { IMemberOrganization, IMemberOrganizationUserValidationDetails, IMemberUserValidationInput, IOrganization, IRenderFriendlyMemberOrganization, MemberUserValidationType } from '@crowd/types'

import { captureApiChange, memberUserValidationAction } from '@crowd/audit-logs'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from '../IServiceOptions'
import MemberAffiliationService from '../memberAffiliationService'

type IOrganizationSummary = Pick<IOrganization, 'id' | 'displayName' | 'logo'>

export default class MemberOrganizationsService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
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
      await MemberAffiliationService.startAffiliationRecalculation(
        memberId,
        [data.organizationId],
        repositoryOptions,
      )

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

      await MemberAffiliationService.startAffiliationRecalculation(
        memberId,
        [data.organizationId],
        repositoryOptions,
      )

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

      await MemberAffiliationService.startAffiliationRecalculation(
        memberId,
        [memberOrganizationToBeDeleted.organizationId],
        repositoryOptions,
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

  async getStatus(memberId: string): Promise<boolean> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    return getMemberOrganizationStatus(qx, memberId)
  }

  async userValidation(memberId: string, data: IMemberUserValidationInput<IMemberOrganizationUserValidationDetails>): Promise<void> {
    try {
      const qx = SequelizeRepository.getQueryExecutor(this.options)
      const result = await createMemberUserValidation(qx, memberId, {
        type: MemberUserValidationType.WORK_HISTORY,
        ...data
      })
      
      // record changes for audit logs
      await captureApiChange(
        this.options,
        memberUserValidationAction(memberId, async (captureState) => {
          captureState(result)
        }),
      )
    } catch (error) {
      this.log.error(error)
      throw error
    }
  }
}