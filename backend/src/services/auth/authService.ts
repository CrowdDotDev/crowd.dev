import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import moment from 'moment'

import { Error400, Error401 } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { API_CONFIG, SSO_CONFIG } from '../../conf'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import TenantUserRepository from '../../database/repositories/tenantUserRepository'
import UserRepository from '../../database/repositories/userRepository'
import Roles from '../../security/roles'
import identify from '../../segment/identify'
import track from '../../segment/track'
import TenantService from '../tenantService'

const BCRYPT_SALT_ROUNDS = 12

const log = getServiceChildLogger('AuthService')

class AuthService {
  static async signup(
    email,
    password,
    invitationToken,
    tenantId,
    firstName,
    lastName,
    acceptedTermsAndPrivacy,
    options: any = {},
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)

    try {
      email = email.toLowerCase()

      const existingUser = await UserRepository.findByEmail(email, options)

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])([^ \t]{8,})$/

      if (!passwordRegex.test(password)) {
        throw new Error400(options.language, 'auth.passwordInvalid')
      }

      // Generates a hashed password to hide the original one.
      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

      // The user may already exist on the database in case it was invided.
      if (existingUser) {
        // If the user already have an password,
        // it means that it has already signed up
        const existingPassword = await UserRepository.findPassword(existingUser.id, options)

        if (existingPassword) {
          throw new Error400(options.language, 'auth.emailAlreadyInUse')
        }

        /**
         * In the case of the user exists on the database (was invited)
         * it only creates the new password
         */
        await UserRepository.updatePassword(existingUser.id, hashedPassword, false, {
          ...options,
          transaction,
          bypassPermissionValidation: true,
        })

        // Handles onboarding process like
        // invitation, creation of default tenant,
        // or default joining the current tenant
        await this.handleOnboard(
          existingUser,
          { invitationToken, tenantId },
          {
            ...options,
            transaction,
          },
        )

        const token = jwt.sign({ id: existingUser.id }, API_CONFIG.jwtSecret, {
          expiresIn: API_CONFIG.jwtExpiresIn,
        })

        await SequelizeRepository.commitTransaction(transaction)

        // Identify in Segment
        identify(existingUser)
        track(
          'Signed up',
          {
            invitation: true,
            email: existingUser.email,
          },
          options,
          existingUser.id,
        )

        return token
      }

      firstName = firstName || email.split('@')[0]
      lastName = lastName || ''
      const fullName = `${firstName} ${lastName}`.trim()
      const newUser = await UserRepository.createFromAuth(
        {
          firstName,
          lastName,
          fullName,
          password: hashedPassword,
          email,
          acceptedTermsAndPrivacy,
        },
        {
          ...options,
          transaction,
        },
      )

      // Handles onboarding process like
      // invitation, creation of default tenant,
      // or default joining the current tenant
      await this.handleOnboard(
        newUser,
        { invitationToken, tenantId },
        {
          ...options,
          transaction,
        },
      )

      // Identify in Segment
      identify(newUser)
      track(
        'Signed up',
        {
          invitation: true,
          email: newUser.email,
        },
        options,
        newUser.id,
      )

      const token = jwt.sign({ id: newUser.id }, API_CONFIG.jwtSecret, {
        expiresIn: API_CONFIG.jwtExpiresIn,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return token
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  static async findByEmail(email, options: any = {}) {
    email = email.toLowerCase()
    return UserRepository.findByEmail(email, options)
  }

  static async signin(email, password, invitationToken, tenantId, options: any = {}) {
    const transaction = await SequelizeRepository.createTransaction(options)

    try {
      email = email.toLowerCase()
      const user = await UserRepository.findByEmail(email, options)

      if (!user) {
        throw new Error400(options.language, 'auth.userNotFound')
      }

      const currentPassword = await UserRepository.findPassword(user.id, options)

      if (!currentPassword) {
        throw new Error400(options.language, 'auth.wrongPassword')
      }

      const passwordsMatch = await bcrypt.compare(password, currentPassword)

      if (!passwordsMatch) {
        throw new Error400(options.language, 'auth.wrongPassword')
      }

      // Handles onboarding process like
      // invitation, creation of default tenant,
      // or default joining the current tenant
      await this.handleOnboard(
        user,
        { invitationToken, tenantId },
        {
          ...options,
          currentUser: user,
          transaction,
        },
      )

      const token = jwt.sign({ id: user.id }, API_CONFIG.jwtSecret, {
        expiresIn: API_CONFIG.jwtExpiresIn,
      })

      identify(user)
      track(
        'Signed in',
        {
          email: user.email,
        },
        options,
        user.id,
      )

      await SequelizeRepository.commitTransaction(transaction)

      return token
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  static async handleOnboard(
    currentUser,
    { invitationToken = null, tenantId = null, roles = [] },
    options,
  ) {
    if (roles === undefined) {
      roles = []
    }
    if (invitationToken) {
      try {
        await TenantUserRepository.acceptInvitation(invitationToken, {
          ...options,
          currentUser,
          bypassPermissionValidation: true,
        })
      } catch (error) {
        log.error(error, 'Error handling onboard!')
        // In case of invitation acceptance error, does not prevent
        // the user from sign up/in
      }
    }

    if (tenantId) {
      await new TenantService({
        ...options,
        currentUser,
      }).joinWithDefaultRolesOrAskApproval(
        {
          tenantId,
          roles,
        },
        options,
      )
    } else {
      // In case is single tenant, and the user is signing in
      // with an invited email and for some reason doesn't have the token
      // it auto-assigns it
      await new TenantService({
        ...options,
        currentUser,
      }).joinDefaultUsingInvitedEmail(options.transaction)

      // Creates or join default Tenant
      await new TenantService({
        ...options,
        currentUser,
      }).createOrJoinDefault(
        {
          roles,
        },
        options.transaction,
      )
    }
  }

  static async findByToken(token, options) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, API_CONFIG.jwtSecret, (err, decoded) => {
        if (err) {
          options.log.error(
            `Error verifying token with secret: ${API_CONFIG.jwtSecret.substring(0, 5)}.....`,
            err,
          )
          reject(err)
          return
        }

        const { id } = decoded
        const jwtTokenIat = decoded.iat

        UserRepository.findById(id, {
          ...options,
          bypassPermissionValidation: true,
        })
          .then((user) => {
            const isTokenManuallyExpired =
              user &&
              user.jwtTokenInvalidBefore &&
              moment.unix(jwtTokenIat).isBefore(moment(user.jwtTokenInvalidBefore))

            if (isTokenManuallyExpired) {
              reject(new Error401())
              return
            }

            if (user) {
              user.emailVerified = true
            }

            resolve(user)
          })
          .catch((error) => reject(error))
      })
    })
  }

  static async changePassword(oldPassword, newPassword, options) {
    const { currentUser } = options
    const currentPassword = await UserRepository.findPassword(options.currentUser.id, options)

    const passwordsMatch = await bcrypt.compare(oldPassword, currentPassword)

    if (!passwordsMatch) {
      throw new Error400(options.language, 'auth.passwordChange.invalidPassword')
    }

    const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)

    return UserRepository.updatePassword(currentUser.id, newHashedPassword, true, options)
  }

  static async signinFromSocial(
    provider,
    providerId,
    email,
    emailVerified,
    firstName,
    lastName,
    fullName,
    options: any = {},
  ) {
    if (!email) {
      throw new Error('auth-no-email')
    }

    const transaction = await SequelizeRepository.createTransaction(options)

    try {
      email = email.toLowerCase()
      let user = await UserRepository.findByEmail(email, options)
      if (user) {
        identify(user)
        track(
          'Signed in',
          {
            [provider]: true,
            email: user.email,
          },
          options,
          user.id,
        )
      }
      // If there was no provider, we can link it to the provider
      if (user && (user.provider === undefined || user.provider === null || user.emailVerified)) {
        await UserRepository.update(
          user.id,
          {
            firstName,
            lastName,
            provider,
            providerId,
            emailVerified,
          },
          options,
        )
        log.debug({ user }, 'User')
      } else if (user && (user.provider !== provider || user.providerId !== providerId)) {
        throw new Error('auth-invalid-provider')
      }

      if (!user) {
        user = await UserRepository.createFromSocial(
          provider,
          providerId,
          email,
          emailVerified,
          firstName,
          lastName,
          fullName,
          options,
        )
        identify(user)
        track(
          'Signed up',
          {
            [provider]: true,
            email: user.email,
          },
          options,
          user.id,
        )
      }
      const token = jwt.sign({ id: user.id }, API_CONFIG.jwtSecret, {
        expiresIn: API_CONFIG.jwtExpiresIn,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return token
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  static async signinFromSSO(
    provider,
    providerId,
    email,
    emailVerified,
    firstName,
    lastName,
    fullName,
    invitationToken,
    tenantId,
    roles,
    options: any = {},
  ) {
    if (!email) {
      throw new Error('auth-no-email')
    }

    if (roles) {
      roles = AuthService.translateLFRoles(roles)
    }

    const transaction = await SequelizeRepository.createTransaction(options)

    try {
      let user = await UserRepository.findByProviderId(providerId, options)
      if (!user) {
        user = await UserRepository.findByEmail(email, options)
      }
      if (user && (user.provider !== provider || user.providerId !== providerId)) {
        await UserRepository.update(
          user.id,
          {
            firstName,
            lastName,
            provider,
            providerId,
            emailVerified,
          },
          options,
        )
      }
      if (user) {
        identify(user)
        track(
          'Signed in',
          {
            [provider]: true,
            email: user.email,
          },
          options,
          user.id,
        )
      }

      if (!user) {
        user = await UserRepository.createFromSocial(
          provider,
          providerId,
          email,
          emailVerified,
          firstName,
          lastName,
          fullName,
          options,
        )
        identify(user)
        track(
          'Signed up',
          {
            [provider]: true,
            email: user.email,
          },
          options,
          user.id,
        )
      }
      if (invitationToken) {
        await this.handleOnboard(
          user,
          { invitationToken, tenantId, roles },
          {
            ...options,
            transaction,
          },
        )
      } else if (user.tenants.length === 0) {
        // if email ends with '@crowd.dev'
        if (email.endsWith('@crowd.dev') && SSO_CONFIG.crowdTenantId) {
          await this.handleOnboard(
            user,
            { tenantId: SSO_CONFIG.crowdTenantId, roles },
            {
              ...options,
              transaction,
            },
          )
        } else if (SSO_CONFIG.lfTenantId) {
          await this.handleOnboard(
            user,
            { tenantId: SSO_CONFIG.lfTenantId, roles },
            {
              ...options,
              transaction,
            },
          )
        } else {
          await this.handleOnboard(
            user,
            { roles },
            {
              ...options,
              transaction,
            },
          )
        }
      } else {
        for (const tenantUser of user.tenants) {
          const tenantUserId = tenantUser.dataValues.id
          await TenantUserRepository.replaceRoles(tenantUserId, roles, {
            ...options,
            transaction,
            currentTenant: {
              id: tenantUser.dataValues.tenantId,
            },
          })
        }
      }

      const token = jwt.sign({ id: user.id }, API_CONFIG.jwtSecret, {
        expiresIn: API_CONFIG.jwtExpiresIn,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return token
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  static translateLFRoles(roles) {
    return roles.map((role) => {
      if (role === 'viewer') {
        return Roles.values.readonly
      }
      return role
    })
  }

  /**
   * Signs up a new user via workspace invitation link
   */
  static async signupViaInvitationLink(
    email,
    password,
    invitationToken,
    firstName,
    lastName,
    acceptedTermsAndPrivacy,
    options: any = {},
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)

    try {
      email = email.toLowerCase()

      // First validate the invitation link and get tenant info
      const tenantService = new TenantService(options)
      const invitationInfo = await tenantService.processInvitationLink(invitationToken, email)

      // Now proceed with regular signup but with specific tenant and role
      const existingUser = await UserRepository.findByEmail(email, options)

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])([^ \t]{8,})$/

      if (!passwordRegex.test(password)) {
        throw new Error400(options.language, 'auth.passwordInvalid')
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

      if (existingUser) {
        const existingPassword = await UserRepository.findPassword(existingUser.id, options)

        if (existingPassword) {
          throw new Error400(options.language, 'auth.emailAlreadyInUse')
        }

        await UserRepository.updatePassword(existingUser.id, hashedPassword, false, {
          ...options,
          transaction,
          bypassPermissionValidation: true,
        })

        // Join the tenant with the default role from invitation
        await new TenantService({
          ...options,
          currentUser: existingUser,
          transaction,
        }).joinWithDefaultRolesOrAskApproval(
          {
            tenantId: invitationInfo.tenantId,
            roles: [invitationInfo.defaultRole],
          },
          { transaction },
        )

        const token = jwt.sign({ id: existingUser.id }, API_CONFIG.jwtSecret, {
          expiresIn: API_CONFIG.jwtExpiresIn,
        })

        await SequelizeRepository.commitTransaction(transaction)

        identify(existingUser)
        track(
          'Signed up',
          {
            invitationLink: true,
            email: existingUser.email,
            tenantId: invitationInfo.tenantId,
          },
          options,
          existingUser.id,
        )

        return {
          token,
          user: existingUser,
        }
      }

      // Create new user
      firstName = firstName || email.split('@')[0]
      lastName = lastName || ''
      const fullName = `${firstName} ${lastName}`.trim()

      const newUser = await UserRepository.createFromAuth(
        {
          firstName,
          lastName,
          fullName,
          password: hashedPassword,
          email,
          acceptedTermsAndPrivacy,
        },
        {
          ...options,
          transaction,
        },
      )

      // Join the tenant with the default role from invitation
      await new TenantService({
        ...options,
        currentUser: newUser,
        transaction,
      }).joinWithDefaultRolesOrAskApproval(
        {
          tenantId: invitationInfo.tenantId,
          roles: [invitationInfo.defaultRole],
        },
        { transaction },
      )

      identify(newUser)
      track(
        'Signed up',
        {
          invitationLink: true,
          email: newUser.email,
          tenantId: invitationInfo.tenantId,
        },
        options,
        newUser.id,
      )

      const token = jwt.sign({ id: newUser.id }, API_CONFIG.jwtSecret, {
        expiresIn: API_CONFIG.jwtExpiresIn,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return token
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }
}

export default AuthService
