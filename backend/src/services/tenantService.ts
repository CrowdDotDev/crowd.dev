import { Error400, Error404 } from '@crowd/common'
import { queryConversations } from '@crowd/data-access-layer'
import { DEFAULT_MEMBER_ATTRIBUTES } from '@crowd/integrations'
import { SegmentData, SegmentStatus, TenantPlans } from '@crowd/types'

import CustomViewRepository from '@/database/repositories/customViewRepository'
import { defaultCustomViews } from '@/types/customView'

import { TenantMode } from '../conf/configTypes'
import { TENANT_MODE } from '../conf/index'
import MicroserviceRepository from '../database/repositories/microserviceRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import TaskRepository from '../database/repositories/taskRepository'
import TenantRepository from '../database/repositories/tenantRepository'
import TenantUserRepository from '../database/repositories/tenantUserRepository'
import * as microserviceTypes from '../database/utils/keys/microserviceTypes'
import Permissions from '../security/permissions'
import Plans from '../security/plans'
import Roles from '../security/roles'

import { IServiceOptions } from './IServiceOptions'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
import MemberService from './memberService'
import OrganizationService from './organizationService'
import SegmentService from './segmentService'
import SettingsService from './settingsService'
import PermissionChecker from './user/permissionChecker'

export default class TenantService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  /**
   * Creates the default tenant or joins the default with
   * roles passed.
   * If default roles are empty, the admin will have to asign the roles
   * to new users.
   */
  async createOrJoinDefault({ roles }, transaction) {
    const tenant = await TenantRepository.findDefault({
      ...this.options,
      transaction,
    })

    if (tenant) {
      const tenantUser = await TenantUserRepository.findByTenantAndUser(
        tenant.id,
        this.options.currentUser.id,
        {
          ...this.options,
          transaction,
        },
      )

      // In this situation, the user has used the invitation token
      // and it is already part of the tenant
      if (tenantUser) {
        return undefined
      }

      return TenantUserRepository.create(tenant, this.options.currentUser, roles, {
        ...this.options,
        transaction,
      })
    }

    const record = await this.create({ name: 'default', url: 'default', integrationsRequired: [] })

    await SettingsService.findOrCreateDefault({
      ...this.options,
      currentTenant: record,
      transaction,
    })

    const tenantUserRepoRecord = await TenantUserRepository.create(
      record,
      this.options.currentUser,
      [Roles.values.admin],
      {
        ...this.options,
        transaction,
      },
    )

    return tenantUserRepoRecord
  }

  async joinWithDefaultRolesOrAskApproval({ roles, tenantId }, { transaction }) {
    const tenant = await TenantRepository.findById(tenantId, {
      ...this.options,
      transaction,
    })

    if (!tenant) {
      this.options.log.error(`Tenant not found: ${tenantId}`)
    }

    const tenantUser = await TenantUserRepository.findByTenantAndUser(
      tenant.id,
      this.options.currentUser.id,
      {
        ...this.options,
        transaction,
      },
    )

    if (tenantUser) {
      // If found the invited tenant user via email
      // accepts the invitation
      if (tenantUser.status === 'invited') {
        return TenantUserRepository.acceptInvitation(tenantUser.invitationToken, {
          ...this.options,
          transaction,
        })
      }

      // In this case the tenant user already exists
      // and it's accepted or with empty permissions
      return undefined
    }

    return TenantUserRepository.create(tenant, this.options.currentUser, roles, {
      ...this.options,
      transaction,
    })
  }

  // In case this user has been invited
  // but havent used the invitation token
  async joinDefaultUsingInvitedEmail(transaction) {
    const tenant = await TenantRepository.findDefault({
      ...this.options,
      transaction,
    })

    if (!tenant) {
      return undefined
    }

    const tenantUser = await TenantUserRepository.findByTenantAndUser(
      tenant.id,
      this.options.currentUser.id,
      {
        ...this.options,
        transaction,
      },
    )

    if (!tenantUser || tenantUser.status !== 'invited') {
      return undefined
    }

    return TenantUserRepository.acceptInvitation(tenantUser.invitationToken, {
      ...this.options,
      transaction,
    })
  }

  async create(data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (TENANT_MODE === TenantMode.SINGLE) {
        const count = await TenantRepository.count(null, {
          ...this.options,
          transaction,
        })

        if (count > 0) {
          throw new Error400(this.options.language, 'tenant.exists')
        }
      }

      if (data.integrationsRequired) {
        // Convert all to lowercase
        data.integrationsRequired = data.integrationsRequired.map((item) => item.toLowerCase())
      }

      const record = await TenantRepository.create(data, {
        ...this.options,
        transaction,
      })

      const segment = await new SegmentService({
        ...this.options,
        currentTenant: record,
        transaction,
      } as IServiceOptions).createProjectGroup({
        name: data.name,
        url: data.url,
        slug: data.url || (await TenantRepository.generateTenantUrl(data.name, this.options)),
        status: SegmentStatus.ACTIVE,
      } as SegmentData)

      this.options.currentSegments = [(segment as any).projects[0].subprojects[0]]

      await SettingsService.findOrCreateDefault({
        ...this.options,
        currentTenant: record,
        transaction,
      })

      const memberAttributeSettingsService = new MemberAttributeSettingsService({
        ...this.options,
        currentTenant: record,
      })

      // create default member attribute settings
      await memberAttributeSettingsService.createPredefined(DEFAULT_MEMBER_ATTRIBUTES, transaction)

      await TenantUserRepository.create(record, this.options.currentUser, [Roles.values.admin], {
        ...this.options,
        transaction,
      })

      // create default microservices for the tenant
      await MicroserviceRepository.create(
        { type: microserviceTypes.membersScore },
        { ...this.options, transaction, currentTenant: record },
      )

      // create suggested tasks
      await TaskRepository.createSuggestedTasks({
        ...this.options,
        transaction,
        currentTenant: record,
      })

      // create default custom views
      for (const entity of Object.values(defaultCustomViews)) {
        for (const customView of entity) {
          await CustomViewRepository.create(customView, {
            ...this.options,
            transaction,
            currentTenant: record,
          })
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async update(id, data, force = false) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      let record = await TenantRepository.findById(id, {
        ...this.options,
        transaction,
        currentTenant: { id },
      })

      if (data.hasSampleData === undefined) {
        data.hasSampleData = record.hasSampleData
      }

      if (!force) {
        new PermissionChecker({
          ...this.options,
          currentTenant: { id },
        }).validateHas(Permissions.values.tenantEdit)
      }

      // if tenant already has some published conversations, updating url is not allowed
      if (data.url && data.url !== record.url) {
        const tenantId = SequelizeRepository.getCurrentTenant(this.options).id
        const segmentIds = SequelizeRepository.getSegmentIds(this.options)

        const publishedConversations = await queryConversations(this.options.qdb, {
          tenantId,
          segmentIds,
          filter: {
            and: [
              {
                published: true,
              },
            ],
          },
          countOnly: true,
        })

        if (publishedConversations.count > 0) {
          throw new Error400(this.options.language, 'tenant.errors.publishedConversationExists')
        }
      }

      record = await TenantRepository.update(id, data, {
        ...this.options,
        transaction,
        currentTenant: record,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async viewOrganizations() {
    return SettingsService.save({ organizationsViewed: true }, this.options)
  }

  async viewContacts() {
    return SettingsService.save({ contactsViewed: true }, this.options)
  }

  async updatePlanUser(id, planStripeCustomerId, planUserId) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await TenantRepository.updatePlanUser(id, planStripeCustomerId, planUserId, {
        ...this.options,
        transaction,
        currentTenant: { id },
        bypassPermissionValidation: true,
      })

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async updatePlanToFree(planStripeCustomerId) {
    return this.updatePlanStatus(planStripeCustomerId, TenantPlans.Essential, 'active')
  }

  async updatePlanStatus(planStripeCustomerId, plan, planStatus) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await TenantRepository.updatePlanStatus(planStripeCustomerId, plan, planStatus, {
        ...this.options,
        transaction,
        bypassPermissionValidation: true,
      })

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        const tenant = await TenantRepository.findById(id, {
          ...this.options,
          transaction,
          currentTenant: { id },
        })

        new PermissionChecker({
          ...this.options,
          currentTenant: tenant,
        }).validateHas(Permissions.values.tenantDestroy)

        if (!Plans.allowTenantDestroy(tenant.plan, tenant.planStatus)) {
          throw new Error400(this.options.language, 'tenant.planActive')
        }

        await TenantRepository.destroy(id, {
          ...this.options,
          transaction,
          currentTenant: { id },
        })
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id, options?) {
    options = options || {}

    return TenantRepository.findById(id, {
      ...this.options,
      ...options,
    })
  }

  async findByUrl(url, options?) {
    options = options || {}

    return TenantRepository.findByUrl(url, {
      ...this.options,
      ...options,
    })
  }

  async findAllAutocomplete(search, limit) {
    return TenantRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return TenantRepository.findAndCountAll(args, this.options)
  }

  /**
   * Find all tenants bypassing default user filter
   * @param args filter argument
   * @returns count and rows of found tenants
   */
  static async _findAndCountAllForEveryUser(args) {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const filterUsers = false

    return TenantRepository.findAndCountAll(args, options, filterUsers)
  }

  async acceptInvitation(token, forceAcceptOtherEmail = false) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const tenantUser = await TenantUserRepository.findByInvitationToken(token, {
        ...this.options,
        transaction,
      })

      if (!tenantUser || tenantUser.status !== 'invited') {
        throw new Error404()
      }

      const isNotCurrentUserEmail = tenantUser.user.id !== this.options.currentUser.id

      if (!forceAcceptOtherEmail && isNotCurrentUserEmail) {
        throw new Error400(
          this.options.language,
          'tenant.invitation.notSameEmail',
          tenantUser.user.email,
          this.options.currentUser.email,
        )
      }

      await TenantUserRepository.acceptInvitation(token, {
        ...this.options,
        currentTenant: { id: tenantUser.tenant.id },
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return tenantUser.tenant
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  async declineInvitation(token) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const tenantUser = await TenantUserRepository.findByInvitationToken(token, {
        ...this.options,
        transaction,
      })

      if (!tenantUser || tenantUser.status !== 'invited') {
        throw new Error404()
      }

      await TenantUserRepository.destroy(tenantUser.tenant.id, this.options.currentUser.id, {
        ...this.options,
        transaction,
        currentTenant: { id: tenantUser.tenant.id },
      })

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.create(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await TenantRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }

  /**
   * Return a list of all the memberToMerge suggestions available in the
   * tenant's members
   */
  async findMembersToMerge(args) {
    const memberService = new MemberService(this.options)
    return memberService.findMembersWithMergeSuggestions(args)
  }

  async findOrganizationsToMerge(args) {
    const organizationService = new OrganizationService(this.options)
    return organizationService.findOrganizationsWithMergeSuggestions(args)
  }
}
