import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getTemporalClient } from '@crowd/temporal'
import { SegmentStatus, TenantPlans } from '@crowd/types'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { API_CONFIG, REDIS_CONFIG, TEMPORAL_CONFIG } from '../../conf'
import Roles from '../../security/roles'
import { IServiceOptions } from '../../services/IServiceOptions'
import { databaseInit } from '../databaseConnection'
import { IRepositoryOptions } from '../repositories/IRepositoryOptions'
import SettingsRepository from '../repositories/settingsRepository'
import TenantRepository from '../repositories/tenantRepository'
import UserRepository from '../repositories/userRepository'

export default class SequelizeTestUtils {
  static async wipeDatabase(db) {
    db = await this.getDatabase(db)
    await db.sequelize.query(`
      truncate table
        tenants,
        integrations,
        activities,
        members,
        automations,
        "automationExecutions",
        conversations,
        notes,
        reports,
        organizations,
        "organizationCaches",
        settings,
        tags,
        tasks,
        users,
        files,
        microservices,
        "eagleEyeContents",
        "eagleEyeActions",
        "auditLogs",
        "memberEnrichmentCache"
      cascade;
    `)
  }

  static async refreshMaterializedViews(db) {
    db = await this.getDatabase(db)
    await db.sequelize.query(
      'refresh materialized view concurrently "memberActivityAggregatesMVs";',
    )
  }

  static async getDatabase(db?) {
    if (!db) {
      db = await databaseInit()
    }
    return db
  }

  static async getTestIServiceOptions(
    db,
    plan: TenantPlans = TenantPlans.Essential,
    tenantName?,
    tenantUrl?,
  ) {
    db = await this.getDatabase(db)

    const randomTenant =
      tenantName && tenantUrl
        ? this.getTenant(tenantName, tenantUrl, plan)
        : this.getRandomTestTenant(plan)

    const randomUser = await this.getRandomUser()

    let tenant = await db.tenant.create(randomTenant)
    const segment = (
      await db.segment.create({
        url: tenant.url,
        name: tenant.name,
        parentName: tenant.name,
        grandparentName: tenant.name,
        slug: 'default',
        parentSlug: 'default',
        grandparentSlug: 'default',
        status: SegmentStatus.ACTIVE,
        sourceId: null,
        sourceParentId: null,
        tenantId: tenant.id,
      })
    ).get({ plain: true })

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
      currentSegments: [segment],
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

    const log = getServiceLogger()

    const redis = await getRedisClient(REDIS_CONFIG, true)

    return {
      language: 'en',
      currentUser: user,
      currentTenant: tenant,
      currentSegments: [segment],
      database: db,
      log,
      redis,
      temporal: await getTemporalClient(TEMPORAL_CONFIG),
    } as IServiceOptions
  }

  static async getTestIRepositoryOptions(db) {
    db = await this.getDatabase(db)

    const randomTenant = this.getRandomTestTenant()
    const randomUser = await this.getRandomUser()

    let tenant = await db.tenant.create(randomTenant)
    const segment = (
      await db.segment.create({
        url: tenant.url,
        name: tenant.name,
        parentName: tenant.name,
        grandparentName: tenant.name,
        slug: 'default',
        parentSlug: 'default',
        grandparentSlug: 'default',
        status: SegmentStatus.ACTIVE,
        description: null,
        sourceId: null,
        sourceParentId: null,
        tenantId: tenant.id,
      })
    ).get({ plain: true })
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
      currentSegments: [segment],
      database: db,
    } as IRepositoryOptions)

    tenant = await TenantRepository.findById(tenant.id, {
      database: db,
    } as IRepositoryOptions)

    const log = getServiceLogger()
    const redis = await getRedisClient(REDIS_CONFIG, true)

    return {
      language: 'en',
      currentUser: user,
      currentTenant: tenant,
      currentSegments: [segment],
      database: db,
      bypassPermissionValidation: true,
      log,
      redis,
      temporal: await getTemporalClient(TEMPORAL_CONFIG),
    } as IRepositoryOptions
  }

  static getRandomTestTenant(plan = TenantPlans.Essential) {
    return this.getTenant(this.getRandomString('test-tenant'), this.getRandomString('url#'), plan)
  }

  static getTenant(name, url, plan = TenantPlans.Essential) {
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
    return jwt.sign({ id: userId }, API_CONFIG.jwtSecret, {
      expiresIn: API_CONFIG.jwtExpiresIn,
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
    let objectWithoutKeys
    if (typeof key === 'string') {
      const { [key]: _, ...otherKeys } = object
      objectWithoutKeys = otherKeys
    } else if (Array.isArray(key)) {
      objectWithoutKeys = key.reduce((acc, i) => {
        const { [i]: _, ...otherKeys } = acc
        acc = otherKeys
        return acc
      }, object)
    }

    return objectWithoutKeys
  }
}
