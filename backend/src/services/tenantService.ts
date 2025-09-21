import crypto from 'crypto'
import { DEFAULT_TENANT_ID, Error400, Error404 } from '@crowd/common'
import { DEFAULT_MEMBER_ATTRIBUTES } from '@crowd/integrations'
import { SegmentData, SegmentStatus } from '@crowd/types'

import CustomViewRepository from '@/database/repositories/customViewRepository'
import { defaultCustomViews } from '@/types/customView'

import { TenantMode } from '../conf/configTypes'
import { TENANT_MODE } from '../conf/index'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import TenantRepository from '../database/repositories/tenantRepository'
import TenantUserRepository from '../database/repositories/tenantUserRepository'
import UserRepository from '../database/repositories/userRepository'
import Permissions from '../security/permissions'
import Roles from '../security/roles'

import { IServiceOptions } from './IServiceOptions'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
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

    const record = await this.create({
      id: DEFAULT_TENANT_ID,
      name: 'default',
      url: 'default',
      integrationsRequired: [],
    })

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

      if (!force) {
        new PermissionChecker({
          ...this.options,
          currentTenant: { id },
        }).validateHas(Permissions.values.tenantEdit)
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
   * Generates a workspace invitation link that allows users with matching email domains to join
   */
  async generateInvitationLink(data) {
    new PermissionChecker(this.options).validateHas(Permissions.values.tenantEdit)

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      // Get the current tenant
      const tenant = await TenantRepository.findById(this.options.currentTenant.id, {
        ...this.options,
        transaction,
      })

      if (!tenant) {
        throw new Error404()
      }

      // Get the tenant owner (first user) to extract email domain
      const tenantOwner = await this._getTenantOwner({
        ...this.options,
        transaction,
      })

      // Validate owner email format
      if (!tenantOwner.email || typeof tenantOwner.email !== 'string' || !tenantOwner.email.includes('@')) {
        throw new Error400(this.options.language, 'tenant.invitation.invalidOwnerEmail')
      }

      const emailParts = tenantOwner.email.split('@')
      if (emailParts.length !== 2 || !emailParts[1]) {
        throw new Error400(this.options.language, 'tenant.invitation.invalidOwnerEmail')
      }

      const ownerEmailDomain = emailParts[1].toLowerCase()

      // Generate a unique invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

      // Store invitation link metadata (using settings or custom table)
      const invitationData = {
        token: invitationToken,
        tenantId: tenant.id,
        createdById: this.options.currentUser.id,
        emailDomain: ownerEmailDomain,
        defaultRole: data.defaultRole || Roles.values.readonly,
        expiresAt,
        createdAt: new Date(),
      }

      // Store in tenant settings for now (could be moved to separate table later)
      const currentSettings = tenant.settings || {}
      if (!currentSettings.invitationLinks) {
        currentSettings.invitationLinks = []
      }
      
      // Remove expired links
      currentSettings.invitationLinks = currentSettings.invitationLinks.filter(
        (link) => new Date(link.expiresAt) > new Date()
      )
      
      // Add new link
      currentSettings.invitationLinks.push(invitationData)

      await TenantRepository.update(
        tenant.id,
        { settings: currentSettings },
        {
          ...this.options,
          transaction,
        }
      )

      await SequelizeRepository.commitTransaction(transaction)

      // Return the invitation link URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8081'
      const invitationUrl = `${baseUrl}/auth/invitation/${invitationToken}`

      return {
        invitationUrl,
        token: invitationToken,
        emailDomain: ownerEmailDomain,
        defaultRole: invitationData.defaultRole,
        expiresAt,
      }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Validates and processes workspace invitation link signup
   */
  async processInvitationLink(invitationToken, userEmail) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      // Find tenant with the invitation token by searching all tenants
      const { rows: tenants } = await TenantRepository.findAndCountAll(
        { filter: {} },
        {
          ...this.options,
          transaction,
        }
      )

      let invitationData = null
      let tenant = null

      for (const t of tenants) {
        const settings = t.settings || {}
        if (settings.invitationLinks) {
          const invitation = settings.invitationLinks.find(
            (link) => link.token === invitationToken && new Date(link.expiresAt) > new Date()
          )
          if (invitation) {
            invitationData = invitation
            tenant = t
            break
          }
        }
      }

      if (!invitationData || !tenant) {
        throw new Error400(this.options.language, 'tenant.invitation.linkNotFound')
      }

      // Validate email format and extract domain
      if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
        throw new Error400(this.options.language, 'tenant.invitation.invalidEmail')
      }

      const emailParts = userEmail.split('@')
      if (emailParts.length !== 2 || !emailParts[1]) {
        throw new Error400(this.options.language, 'tenant.invitation.invalidEmail')
      }

      const userEmailDomain = emailParts[1].toLowerCase()
      if (userEmailDomain !== invitationData.emailDomain) {
        throw new Error400(this.options.language, 'tenant.invitation.domainMismatch', invitationData.emailDomain)
      }

      await SequelizeRepository.commitTransaction(transaction)

      return {
        tenantId: tenant.id,
        defaultRole: invitationData.defaultRole,
        emailDomain: invitationData.emailDomain,
      }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  /**
   * Gets the tenant owner (first user)
   */
  async _getTenantOwner(options) {
    const tenantUsers = await TenantUserRepository.findByTenant(this.options.currentTenant.id, options)
    
    if (!tenantUsers || tenantUsers.length === 0) {
      throw new Error400(this.options.language, 'tenant.noUsers')
    }

    // Find the owner (user with admin role created first)
    const ownerTenantUser = tenantUsers
      .filter(tu => tu.roles.includes(Roles.values.admin))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

    if (!ownerTenantUser) {
      // If no admin found, use the first user
      const firstTenantUser = tenantUsers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
      
      // Get the user details
      const user = await UserRepository.findById(firstTenantUser.userId, {
        ...options,
      })
      
      return user
    }

    // Get the owner user details
    const ownerUser = await UserRepository.findById(ownerTenantUser.userId, {
      ...options,
    })

    return ownerUser
  }
}
