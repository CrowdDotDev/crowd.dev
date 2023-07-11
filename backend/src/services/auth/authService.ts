import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { getServiceChildLogger } from '@crowd/logging'
import { TenantMode } from '../../conf/configTypes'
import UserRepository from '../../database/repositories/userRepository'
import Error400 from '../../errors/Error400'
import EmailSender from '../emailSender'
import TenantUserRepository from '../../database/repositories/tenantUserRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { API_CONFIG, TENANT_MODE } from '../../conf'
import TenantService from '../tenantService'
import TenantRepository from '../../database/repositories/tenantRepository'
import { tenantSubdomain } from '../tenantSubdomain'
import Error401 from '../../errors/Error401'
import identify from '../../segment/identify'
import track from '../../segment/track'

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
    options: any = {},
  ) {
    const transaction = await SequelizeRepository.createTransaction(options)

    try {
      email = email.toLowerCase()

      const existingUser = await UserRepository.findByEmail(email, options)

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
        await this.handleOnboard(existingUser, invitationToken, tenantId, {
          ...options,
          transaction,
        })

        // Email may have been alreadyverified using the invitation token
        const isEmailVerified = Boolean(
          await UserRepository.count(
            {
              emailVerified: true,
              id: existingUser.id,
            },
            {
              ...options,
              transaction,
            },
          ),
        )

        if (!isEmailVerified && EmailSender.isConfigured) {
          await this.sendEmailAddressVerificationEmail(
            options.language,
            existingUser.email,
            tenantId,
            {
              ...options,
              transaction,
              bypassPermissionValidation: true,
            },
          )
        }

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
        },
        {
          ...options,
          transaction,
        },
      )

      // Handles onboarding process like
      // invitation, creation of default tenant,
      // or default joining the current tenant
      await this.handleOnboard(newUser, invitationToken, tenantId, {
        ...options,
        transaction,
      })

      // Email may have been alreadyverified using the invitation token
      const isEmailVerified = Boolean(
        await UserRepository.count(
          {
            emailVerified: true,
            id: newUser.id,
          },
          {
            ...options,
            transaction,
          },
        ),
      )

      if (!isEmailVerified && EmailSender.isConfigured) {
        await this.sendEmailAddressVerificationEmail(options.language, newUser.email, tenantId, {
          ...options,
          transaction,
        })
      }

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
      await this.handleOnboard(user, invitationToken, tenantId, {
        ...options,
        currentUser: user,
        transaction,
      })

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

  static async handleOnboard(currentUser, invitationToken, tenantId, options) {
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

    const isMultiTenantViaSubdomain =
      [TenantMode.MULTI, TenantMode.MULTI_WITH_SUBDOMAIN].includes(TENANT_MODE) && tenantId

    if (isMultiTenantViaSubdomain) {
      await new TenantService({
        ...options,
        currentUser,
      }).joinWithDefaultRolesOrAskApproval(
        {
          tenantId,
          // leave empty to require admin's approval
          roles: [],
        },
        options,
      )
    }

    const singleTenant = TENANT_MODE === TenantMode.SINGLE

    if (singleTenant) {
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
          // leave empty to require admin's approval
          roles: [],
        },
        options.transaction,
      )
    }
  }

  static async findByToken(token, options) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, API_CONFIG.jwtSecret, (err, decoded) => {
        if (err) {
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

            // If the email sender id not configured,
            // removes the need for email verification.
            if (user && !EmailSender.isConfigured) {
              user.emailVerified = true
            }

            resolve(user)
          })
          .catch((error) => reject(error))
      })
    })
  }

  static async sendEmailAddressVerificationEmail(language, email, tenantId, options) {
    if (!EmailSender.isConfigured) {
      throw new Error400(language, 'email.error')
    }

    let link
    try {
      let tenant

      if (tenantId) {
        tenant = await TenantRepository.findById(tenantId, {
          ...options,
        })
      }

      email = email.toLowerCase()
      const token = await UserRepository.generateEmailVerificationToken(email, options)
      link = `${tenantSubdomain.frontendUrl(tenant)}/auth/verify-email?token=${token}`
    } catch (error) {
      log.error(error, 'Error sending email address verification email!')
      throw new Error400(language, 'auth.emailAddressVerificationEmail.error')
    }

    return new EmailSender(EmailSender.TEMPLATES.EMAIL_ADDRESS_VERIFICATION, { link }).sendTo(email)
  }

  static async sendPasswordResetEmail(language, email, tenantId, options) {
    if (!EmailSender.isConfigured) {
      throw new Error400(language, 'email.error')
    }

    let link

    try {
      let tenant

      if (tenantId) {
        tenant = await TenantRepository.findById(tenantId, {
          ...options,
        })
      }

      email = email.toLowerCase()
      const token = await UserRepository.generatePasswordResetToken(email, options)

      link = `${tenantSubdomain.frontendUrl(tenant)}/auth/password-reset?token=${token}`
    } catch (error) {
      log.error(error, 'Error sending password reset email')
      throw new Error400(language, 'auth.passwordReset.error')
    }

    return new EmailSender(EmailSender.TEMPLATES.PASSWORD_RESET, { link }).sendTo(email)
  }

  static async verifyEmail(token, options) {
    const { currentUser } = options

    const user = await UserRepository.findByEmailVerificationToken(token, options)

    if (!user) {
      throw new Error400(options.language, 'auth.emailAddressVerificationEmail.invalidToken')
    }

    if (currentUser && currentUser.id && currentUser.id !== user.id) {
      throw new Error400(
        options.language,
        'auth.emailAddressVerificationEmail.signedInAsWrongUser',
        user.email,
        currentUser.email,
      )
    }

    return UserRepository.markEmailVerified(user.id, options)
  }

  static async passwordReset(token, password, options: any = {}) {
    const user = await UserRepository.findByPasswordResetToken(token, options)

    if (!user) {
      throw new Error400(options.language, 'auth.passwordReset.invalidToken')
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

    return UserRepository.updatePassword(user.id, hashedPassword, true, {
      ...options,
      bypassPermissionValidation: true,
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
            google: true,
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
            google: true,
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
            google: providerId.includes('google'),
            email: user.email,
          },
          options,
          user.id,
        )
      }

      // If there was no provider, we can link it to the provider
      if (user && (!user.provider || !user.providerId)) {
        await UserRepository.update(
          user.id,
          {
            provider,
            providerId,
          },
          options,
        )
        log.debug({ user }, 'User')
      }
      if (user && !user.emailVerified && emailVerified) {
        await UserRepository.update(
          user.id,
          {
            emailVerified,
          },
          options,
        )
        log.debug({ user }, 'User')
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
            google: true,
            email: user.email,
          },
          options,
          user.id,
        )
      }
      if (invitationToken) {
        await this.handleOnboard(user, invitationToken, tenantId, {
          ...options,
          transaction,
        })
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
}

export default AuthService
