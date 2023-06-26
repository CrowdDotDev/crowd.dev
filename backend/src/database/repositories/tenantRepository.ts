import lodash from 'lodash'
import moment from 'moment'
import Sequelize, { QueryTypes } from 'sequelize'
import { getCleanString } from '@crowd/common'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'
import Error404 from '../../errors/Error404'
import Error400 from '../../errors/Error400'
import { isUserInTenant } from '../utils/userTenantUtils'
import { IRepositoryOptions } from './IRepositoryOptions'
import SegmentRepository from './segmentRepository'
import isFeatureEnabled from '../../feature-flags/isFeatureEnabled'
import { FeatureFlag, Edition } from '../../types/common'
import Plans from '../../security/plans'
import { API_CONFIG } from '../../conf'

const { Op } = Sequelize

const forbiddenTenantUrls = ['www']

class TenantRepository {
  static async getPayingTenantIds(options: IRepositoryOptions): Promise<({ id: string } & {})[]> {
    const database = SequelizeRepository.getSequelize(options)
    const plans = Plans.values
    const transaction = SequelizeRepository.getTransaction(options)

    const query = `
      SELECT "id"
      FROM "tenants"
      WHERE tenants."plan" IN (:growth)
        OR (tenants."isTrialPlan" is true AND tenants."plan" = :growth)
      ;
    `
    return database.query(query, {
      type: QueryTypes.SELECT,
      transaction,
      replacements: {
        growth: plans.growth,
      },
    })
  }

  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    // name is required
    if (!data.name) {
      throw new Error400(options.language, 'tenant.errors.nameRequiredOnCreate')
    }

    data.url = data.url || (await TenantRepository.generateTenantUrl(data.name, options))

    const existsUrl = Boolean(
      await options.database.tenant.count({
        where: { url: data.url },
        transaction,
      }),
    )

    if (forbiddenTenantUrls.includes(data.url) || existsUrl) {
      throw new Error400(options.language, 'tenant.url.exists')
    }

    const trialEndsAt = moment().add(14, 'days').isAfter('2023-01-15')
      ? moment().add(14, 'days').toISOString()
      : '2023-01-15'

    const record = await options.database.tenant.create(
      {
        ...lodash.pick(data, [
          'id',
          'name',
          'url',
          'communitySize',
          'reasonForUsingCrowd',
          'integrationsRequired',
          'importHash',
        ]),
        plan: API_CONFIG.edition === Edition.LFX ? Plans.values.enterprise : Plans.values.growth,
        isTrialPlan: API_CONFIG.edition !== Edition.LFX,
        trialEndsAt: API_CONFIG.edition !== Edition.LFX ? trialEndsAt : null,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, {
      ...options,
      currentTenant: record,
    })

    return this.findById(record.id, {
      ...options,
    })
  }

  /**
   * Generates hyphen concataned tenant url from the tenant name
   * If url already exists, appends a incremental number to the url
   * @param name tenant name
   * @param options repository options
   * @returns slug like tenant name to be used in tenant.url
   */
  static async generateTenantUrl(name: string, options: IRepositoryOptions): Promise<string> {
    const cleanedName = getCleanString(name)

    const nameWordsArray = cleanedName.split(' ')

    let cleanedTenantUrl = ''

    for (let i = 0; i < nameWordsArray.length; i++) {
      cleanedTenantUrl += `${nameWordsArray[i]}-`
    }

    // remove trailing dash
    cleanedTenantUrl = cleanedTenantUrl.replace(/-$/gi, '')

    const filterUser = false

    const checkTenantUrl = await TenantRepository.findAndCountAll(
      { filter: { url: cleanedTenantUrl } },
      options,
      filterUser,
    )

    if (checkTenantUrl.count > 0) {
      cleanedTenantUrl += `-${checkTenantUrl.count}`
    }

    return cleanedTenantUrl
  }

  static async update(id, data, options: IRepositoryOptions, force = false) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.tenant.findByPk(id, {
      transaction,
    })

    if (!force && !isUserInTenant(currentUser, record)) {
      throw new Error404()
    }

    // When not multi-with-subdomain, the
    // from passes the URL as undefined.
    // This way it's ensured that the URL will
    // remain the old one
    data.url = data.url || record.url

    const existsUrl = Boolean(
      await options.database.tenant.count({
        where: {
          url: data.url,
          id: { [Op.ne]: id },
        },
        transaction,
      }),
    )

    if (forbiddenTenantUrls.includes(data.url) || existsUrl) {
      throw new Error400(options.language, 'tenant.url.exists')
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'id',
          'name',
          'url',
          'communitySize',
          'reasonForUsingCrowd',
          'integrationsRequired',
          'onboardedAt',
          'hasSampleData',
          'importHash',
          'plan',
          'isTrialPlan',
          'trialEndsAt',
        ]),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async updatePlanUser(id, planStripeCustomerId, planUserId, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.tenant.findByPk(id, {
      transaction,
    })

    const data = {
      planStripeCustomerId,
      planUserId,
      updatedById: currentUser.id,
    }

    record = await record.update(data, {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async updatePlanStatus(
    planStripeCustomerId,
    plan,
    planStatus,
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.tenant.findOne({
      where: {
        planStripeCustomerId,
      },
      transaction,
    })

    const data = {
      plan,
      planStatus,
      updatedById: null,
    }

    record = await record.update(data, {
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentUser = SequelizeRepository.getCurrentUser(options)

    const record = await options.database.tenant.findByPk(id, {
      transaction,
    })

    if (!isUserInTenant(currentUser, record)) {
      throw new Error404()
    }

    await record.destroy({
      transaction,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions, segments: string[] = []) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = ['settings', 'conversationSettings']

    const record = await options.database.tenant.findByPk(id, {
      include,
      transaction,
    })

    const segmentRepository = new SegmentRepository({ ...options, currentTenant: record })
    let segmentsFound

    if (!(await isFeatureEnabled(FeatureFlag.SEGMENTS, { ...options, currentTenant: record }))) {
      // return default segment
      const defaultSegment = await segmentRepository.getDefaultSegment()
      segmentsFound = defaultSegment ? [defaultSegment] : []
    } else if (segments.length > 0) {
      segmentsFound = await segmentRepository.findInIds(segments)
    } else {
      // no segment info sent, return all segments
      segmentsFound = (await segmentRepository.querySubprojects({})).rows
    }

    if (
      record &&
      record.settings &&
      record.settings[0] &&
      record.settings[0].dataValues &&
      segmentsFound.length > 0
    ) {
      record.settings[0].dataValues.activityTypes = SegmentRepository.getActivityTypes({
        ...options,
        currentTenant: record,
        currentSegments: segmentsFound,
      })
      record.settings[0].dataValues.slackWebHook = !!record.settings[0].dataValues.slackWebHook
    }

    return record
  }

  static async findByUrl(url, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = ['settings', 'conversationSettings']

    const record = await options.database.tenant.findOne({
      where: { url },
      include,
      transaction,
    })

    if (record && record.settings && record.settings[0] && record.settings[0].dataValues) {
      record.settings[0].dataValues.slackWebHook = !!record.settings[0].dataValues.slackWebHook
    }

    return record
  }

  static async count(filter, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    return options.database.tenant.count({
      where: filter,
      transaction,
    })
  }

  static async findDefault(options: IRepositoryOptions) {
    return options.database.tenant.findOne({
      transaction: SequelizeRepository.getTransaction(options),
    })
  }

  /**
   * Finds and counts all tenants with given filter options
   * @param param0 object representation of filter, limit, offset and order
   * @param options IRepositoryOptions to filter out results by tenant
   * @param filterUser set to false if default user filter is not needed
   * @returns rows and total found count of found tenants
   */
  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
    filterUser = true,
  ) {
    const whereAnd: Array<any> = []
    const include = []

    if (filterUser) {
      const currentUser = SequelizeRepository.getCurrentUser(options)

      // Fetch only tenant that the current user has access
      whereAnd.push({
        id: {
          [Op.in]: currentUser.tenants.map((tenantUser) => tenantUser.tenant.id),
        },
      })
    }

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          id: filter.id,
        })
      }

      if (filter.name) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('tenant', 'name', filter.name))
      }

      if (filter.url) {
        whereAnd.push(SequelizeFilterUtils.ilikeIncludes('tenant', 'url', filter.url))
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            createdAt: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            createdAt: {
              [Op.lte]: end,
            },
          })
        }
      }
    }

    const where = { [Op.and]: whereAnd }

    const { rows, count } = await options.database.tenant.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy ? [orderBy.split('_')] : [['name', 'ASC']],
      transaction: SequelizeRepository.getTransaction(options),
    })

    return { rows, count, limit: false, offset: 0 }
  }

  static async findAllAutocomplete(query, limit, options: IRepositoryOptions) {
    const whereAnd: Array<any> = []

    const currentUser = SequelizeRepository.getCurrentUser(options)

    // Fetch only tenant that the current user has access
    whereAnd.push({
      id: {
        [Op.in]: currentUser.tenants.map((tenantUser) => tenantUser.tenant.id),
      },
    })

    if (query) {
      whereAnd.push({
        [Op.or]: [
          { id: query.id },
          {
            [Op.and]: SequelizeFilterUtils.ilikeIncludes('tenant', 'name', query.name),
          },
        ],
      })
    }

    const where = { [Op.and]: whereAnd }

    const records = await options.database.tenant.findAll({
      attributes: ['id', 'name'],
      where,
      limit: limit ? Number(limit) : undefined,
      order: [['name', 'ASC']],
    })

    return records.map((record) => ({
      id: record.id,
      label: record.name,
    }))
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = {
        ...record.get({ plain: true }),
      }
    }

    await AuditLogRepository.log(
      {
        entityName: 'tenant',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }

  /**
   * Get current tenant
   * @param options Repository options
   * @returns Current tenant
   */
  static getCurrentTenant(options: IRepositoryOptions) {
    return SequelizeRepository.getCurrentTenant(options)
  }

  static async getAvailablePlatforms(id, options: IRepositoryOptions) {
    const query = `
        select distinct platform from "memberIdentities" where "tenantId" = :tenantId
    `
    const parameters: any = {
      tenantId: id,
    }

    const platforms = await options.database.sequelize.query(query, {
      replacements: parameters,
      type: QueryTypes.SELECT,
    })

    return platforms
  }
}

export default TenantRepository
