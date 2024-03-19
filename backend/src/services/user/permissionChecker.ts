import assert from 'assert'
import lodash from 'lodash'
import { Error400, Error403 } from '@crowd/common'
import { TenantPlans } from '@crowd/types'
import Permissions from '../../security/permissions'
import EmailSender from '../emailSender'
import Roles from '../../security/roles'

const roles = Roles.values

/**
 * Checks the Permission of the User on a Tenant.
 */
export default class PermissionChecker {
  currentTenant

  language

  currentUser

  adminSegments

  currentSegments

  constructor({ currentTenant, language, currentUser, currentSegments }) {
    this.currentTenant = currentTenant
    this.language = language
    this.currentUser = currentUser
    this.currentSegments = currentSegments
    this.adminSegments = !currentUser
      ? []
      : currentUser.tenants.find((t) => t.tenantId === currentTenant.id)?.adminSegments
  }

  /**
   * Validates if the user has a specific permission
   * and throws a Error403 if it doesn't.
   */
  public validateHas(permission) {
    if (!this.has(permission)) {
      throw new Error403(this.language)
    }
  }

  /**
   * Validates if the user has any permission among specified
   * and throws Error403 if it doesn't
   */
  public validateHasAny(permissions) {
    const hasOne = permissions.some((p) => this.has(p))

    if (!hasOne) {
      throw new Error403(this.language)
    }
  }

  /**
   * Checks if the user has permission to change certain protected
   * fields in an integration.
   * @param data Data sent to the integration write service
   */
  public validateIntegrationsProtectedFields(data) {
    if (data.limitCount !== undefined) {
      this.validateHas(Permissions.values.integrationControlLimit)
    }
  }

  /**
   * Checks if the user has permission to change certain protected
   * fields in a microservice.
   * @param data Data sent to the microservice write service
   */
  public validateMicroservicesProtectedFields(data) {
    if (data.variant !== undefined) {
      if (data.variant === 'default') {
        this.validateHas(Permissions.values.microserviceVariantFree)
      } else if (data.variant === 'premium') {
        this.validateHas(Permissions.values.microserviceVariantPremium)
      } else {
        throw new Error400(`Invalid variant: ${data.variant}`)
      }
    }
  }

  /**
   * Checks if the user has a specific permission.
   */
  private has(permission) {
    assert(permission, 'permission is required')

    if (!this.currentUser) {
      throw new Error403(this.language, 'no currentUser')
    }

    if (!this.isEmailVerified) {
      throw new Error403(this.language, 'email not verified')
    }

    if (!this.hasPlanPermission(permission)) {
      throw new Error403(this.language, 'not allowed on this plan')
    }

    const allowedRoles = this.findAllowedRoles(permission)
    if (lodash.isEqual(allowedRoles, [roles.projectAdmin])) {
      this.validateSegmentPermission()
    }

    return true
  }

  /**
   * Validates if the user has access to a storage.
   */
  private hasStorage(storageId: string) {
    assert(storageId, 'storageId is required')
    return this.allowedStorageIds().includes(storageId)
  }

  /**
   * Checks if the user has any of the allowed roles for the permission.
   */
  private findAllowedRoles(permission) {
    const allowedRoles = this.currentUserRolesIds.filter((role) =>
      permission.allowedRoles.some((allowedRole) => allowedRole === role),
    )

    if (allowedRoles.length === 0) {
      throw new Error403(
        this.language,
        `not allowed by role. Current: ${this.currentUserRolesIds}. Allowed: ${permission.allowedRoles}`,
      )
    }

    return allowedRoles
  }

  private validateSegmentPermission() {
    const allowed = this.currentSegments.some((segment) => this.adminSegments.includes(segment.id))
    if (!allowed) {
      throw new Error403(
        this.language,
        'not allowed by segment. ' +
          `Request segments: ${this.currentSegments.map((s) => s.id)}. ` +
          `User admin segments: ${this.adminSegments}`,
      )
    }
  }

  /**
   * Checks if the current company plan allows the permission.
   */
  private hasPlanPermission(permission) {
    assert(permission, 'permission is required')

    return permission.allowedPlans.includes(this.currentTenantPlan)
  }

  private get isEmailVerified() {
    // Only checks if the email is verified
    // if the email system is on
    if (!EmailSender.isConfigured) {
      return true
    }

    return this.currentUser.emailVerified
  }

  /**
   * Returns the Current User Roles.
   */
  private get currentUserRolesIds() {
    if (!this.currentUser || !this.currentUser.tenants) {
      return []
    }

    const tenant = this.currentUser.tenants
      .filter((tenantUser) => tenantUser.status === 'active')
      .find((tenantUser) => tenantUser.tenant.id === this.currentTenant.id)

    if (!tenant) {
      return []
    }

    const userRoles = tenant.roles
    if (userRoles.includes(roles.projectAdmin)) {
      return lodash.uniq(userRoles.concat(roles.readonly))
    }

    return userRoles
  }

  /**
   * Return the current tenant plan,
   * check also if it's not expired.
   */
  private get currentTenantPlan() {
    if (!this.currentTenant || !this.currentTenant.plan) {
      return TenantPlans.Essential
    }

    return this.currentTenant.plan
  }

  /**
   * Returns the allowed storage ids for the user.
   */
  private allowedStorageIds() {
    let allowedStorageIds: Array<string> = []

    Permissions.asArray.forEach((permission) => {
      if (this.has(permission)) {
        allowedStorageIds = allowedStorageIds.concat(
          (permission.allowedStorage || []).map((storage) => storage.id),
        )
      }
    })

    return [...new Set(allowedStorageIds)]
  }
}
