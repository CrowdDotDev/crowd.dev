import lodash from 'lodash'
import { TENANT_MODE } from '../config/index'
import TenantRepository from '../database/repositories/tenantRepository'
import TenantUserRepository from '../database/repositories/tenantUserRepository'
import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import PermissionChecker from './user/permissionChecker'
import Permissions from '../security/permissions'
import Error404 from '../errors/Error404'
import Roles from '../security/roles'
import SettingsService from './settingsService'
import Plans from '../security/plans'
import { IServiceOptions } from './IServiceOptions'
import CommunityMemberService from './communityMemberService'
import * as microserviceTypes from '../database/utils/keys/microserviceTypes'
import defaultReport from '../jsons/default-report.json'
import dashboardWidgets from '../jsons/dashboard-widgets.json'

import ReportRepository from '../database/repositories/reportRepository'
import WidgetRepository from '../database/repositories/widgetRepository'
import MicroserviceRepository from '../database/repositories/microserviceRepository'
import ConversationRepository from '../database/repositories/conversationRepository'
import { TenantMode } from '../config/configTypes'

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

    const record = await TenantRepository.create(
      { name: 'default', url: 'default' },
      {
        ...this.options,
        transaction,
      },
    )

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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

      const record = await TenantRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SettingsService.findOrCreateDefault({
        ...this.options,
        currentTenant: record,
        transaction,
      })

      await TenantUserRepository.create(record, this.options.currentUser, [Roles.values.admin], {
        ...this.options,
        transaction,
      })

      // create default microservices for the tenant
      await MicroserviceRepository.create(
        { type: microserviceTypes.checkMerge },
        { ...this.options, transaction, currentTenant: record },
      )
      await MicroserviceRepository.create(
        { type: microserviceTypes.membersScore },
        { ...this.options, transaction, currentTenant: record },
      )

      // create default report for the tenant
      const report = await ReportRepository.create(
        {
          name: defaultReport.name,
          public: defaultReport.public,
        },
        { ...this.options, transaction, currentTenant: record },
      )

      for (const widgetToCreate of defaultReport.widgets) {
        await WidgetRepository.create(
          {
            ...widgetToCreate,
            report: report.id,
          },
          { ...this.options, transaction, currentTenant: record },
        )
      }

      // create dashboard widgets
      for (const widgetType of dashboardWidgets) {
        await WidgetRepository.create(
          { type: widgetType },
          { ...this.options, transaction, currentTenant: record },
        )
      }

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      let record = await TenantRepository.findById(id, {
        ...this.options,
        transaction,
        currentTenant: { id },
      })

      if (data.hasSampleData === undefined) {
        data.hasSampleData = record.hasSampleData
      }

      new PermissionChecker({
        ...this.options,
        currentTenant: { id },
      }).validateHas(Permissions.values.tenantEdit)

      // if tenant already has some published conversations, updating url is not allowed
      if (data.url && data.url !== record.url) {
        const publishedConversations = await ConversationRepository.findAndCountAll(
          { filter: { published: true } },
          { ...this.options, transaction, currentTenant: record },
        )

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

  async updatePlanUser(id, planStripeCustomerId, planUserId) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
    return this.updatePlanStatus(planStripeCustomerId, Plans.values.free, 'active')
  }

  async updatePlanStatus(planStripeCustomerId, plan, planStatus) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

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
   * tenant's community members
   */
  async findMembersToMerge() {
    const communityMemberService = new CommunityMemberService(this.options)
    const { rows } = await communityMemberService.findMembersWithMergeSuggestions()

    return rows
      .map((item) => {
        item.toMerge = item.toMerge.map((i) => i.get({ plain: true }))

        return item.get({ plain: true })
      })
      .reduce((acc, item) => {
        for (const toMergeMember of item.toMerge) {
          const tp = [toMergeMember, item]
          if (
            lodash.find(acc, (pair) => pair[0].id === tp[0].id && pair[1].id === tp[1].id) ===
            undefined
          ) {
            acc.push([item, toMergeMember])
          }
        }
        return acc
      }, [])
  }
}
