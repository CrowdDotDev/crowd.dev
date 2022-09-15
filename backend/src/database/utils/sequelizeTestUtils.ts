import moment from 'moment'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { databaseInit } from '../databaseConnection'
import { IRepositoryOptions } from '../repositories/IRepositoryOptions'
import { IServiceOptions } from '../../services/IServiceOptions'
import Roles from '../../security/roles'
import UserRepository from '../repositories/userRepository'
import TenantRepository from '../repositories/tenantRepository'
import Plans from '../../security/plans'
import { getConfig } from '../../config'
import SettingsRepository from '../repositories/settingsRepository'

export default class SequelizeTestUtils {
  static async wipeDatabase(db) {
    db = await this.getDatabase(db)
    await db.sequelize.sync({ force: true })
  }

  static async getDatabase(db?) {
    if (!db) {
      db = await databaseInit()
    }
    return db
  }

  static async getTestIServiceOptions(db, plan = Plans.values.free, tenantName?, tenantUrl?) {
    db = await this.getDatabase(db)

    const randomTenant =
      tenantName && tenantUrl
        ? this.getTenant(tenantName, tenantUrl, plan)
        : this.getRandomTestTenant(plan)

    const randomUser = await this.getRandomUser()

    let tenant = await db.tenant.create(randomTenant)

    let user = await db.user.create(randomUser)

    await db.tenantUser.create({
      roles: [Roles.values.admin],
      status: 'active',
      tenantId: tenant.id,
      userId: user.id,
    })


    await SettingsRepository.findOrCreateDefault({}, {
      language: 'en',
      currentUser: user,
      currentTenant: tenant,
      database: db,
    } as IRepositoryOptions)

    tenant = await TenantRepository.findById(tenant.id, {
      database: db,
    } as IRepositoryOptions)

    user = await UserRepository.findById(user.id, {
      database: db,
      currentTenant: tenant,
      bypassPermissionValidation: true,
    } as IRepositoryOptions)


    return {
      language: 'en',
      currentUser: user,
      currentTenant: tenant,
      database: db,
    } as IServiceOptions
  }

  static async getTestIRepositoryOptions(db) {
    db = await this.getDatabase(db)

    const randomTenant = this.getRandomTestTenant()
    const randomUser = await this.getRandomUser()

    let tenant = await db.tenant.create(randomTenant)
    const user = await db.user.create(randomUser)
    await db.tenantUser.create({
      roles: ['admin'],
      status: 'active',
      tenantId: tenant.id,
      userId: user.id,
    })

    await SettingsRepository.findOrCreateDefault({}, {
      language: 'en',
      currentUser: user,
      currentTenant: tenant,
      database: db,
    } as IRepositoryOptions)

    tenant = await TenantRepository.findById(tenant.id, {
      database: db,
    } as IRepositoryOptions)

    return {
      language: 'en',
      currentUser: user,
      currentTenant: tenant,
      database: db,
      bypassPermissionValidation: true,
    } as IRepositoryOptions
  }

  static getRandomTestTenant(plan = Plans.values.free) {
    return this.getTenant(this.getRandomString('test-tenant'), this.getRandomString('url#'), plan)
  }

  static getTenant(name, url, plan = Plans.values.free) {
    return {
      name,
      url,
      plan,
    }
  }

  static async getRandomUser() {
    return {
      email: this.getRandomString('test-user-', '@crowd.dev'),
      password: await bcrypt.hash('12345', 12),
      emailVerified: true,
    }
  }

  static getUserToken(mockIRepositoryOptions) {
    const userId = mockIRepositoryOptions.currentUser.id
    return jwt.sign({ id: userId }, getConfig().AUTH_JWT_SECRET, {
      expiresIn: getConfig().AUTH_JWT_EXPIRES_IN,
    })
  }

  static getRandomString(prefix = '', suffix = '') {
    const randomTestSuffix = Math.trunc(Math.random() * 50000 + 1)

    return `${prefix}${randomTestSuffix}${suffix}`
  }

  static getNowWithoutTime() {
    return moment.utc().format('YYYY-MM-DD')
  }

  static async closeConnection(db) {
    db = await this.getDatabase(db)
    db.sequelize.close()
  }

  static objectWithoutKey(object, key) {
    const { [key]: _, ...otherKeys } = object
    return otherKeys
  }
}
