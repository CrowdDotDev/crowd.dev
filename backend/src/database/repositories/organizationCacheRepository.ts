import { Error404 } from '@crowd/common'
import lodash from 'lodash'
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import AuditLogRepository from './auditLogRepository'
import SequelizeRepository from './sequelizeRepository'

class OrganizationCacheRepository {
  static async linkCacheAndOrganization(
    cacheId: string,
    organizationId: string,
    options: IRepositoryOptions,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    await seq.query(
      `
      insert into "organizationCacheLinks"("organizationCacheId", "organizationId")
      values (:cacheId, :organizationId)
      on conflict do nothing;
      `,
      {
        replacements: {
          cacheId,
          organizationId,
        },
        transaction,
        type: QueryTypes.INSERT,
      },
    )
  }

  private static COMMON_COLUMNS = [
    'description',
    'emails',
    'phoneNumbers',
    'logo',
    'tags',
    'twitter',
    'linkedin',
    'crunchbase',
    'employees',
    'revenueRange',
    'importHash',
    'location',
    'github',
    'lastEnrichedAt',
    'employeeCountByCountry',
    'type',
    'geoLocation',
    'size',
    'ticker',
    'headline',
    'profiles',
    'address',
    'industry',
    'founded',
    'manuallyCreated',
    'naics',
    'affiliatedProfiles',
    'allSubsidiaries',
    'alternativeDomains',
    'alternativeNames',
    'averageEmployeeTenure',
    'averageTenureByLevel',
    'averageTenureByRole',
    'directSubsidiaries',
    'employeeChurnRate',
    'employeeCountByMonth',
    'employeeGrowthRate',
    'employeeCountByMonthByLevel',
    'employeeCountByMonthByRole',
    'gicsSector',
    'grossAdditionsByMonth',
    'grossDeparturesByMonth',
    'ultimateParent',
    'immediateParent',
  ]

  static async create(data, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    const record = await options.database.organizationCache.create(
      {
        ...lodash.pick(data, ['url', 'enriched', ...OrganizationCacheRepository.COMMON_COLUMNS]),
      },
      {
        transaction,
      },
    )

    await seq.query(
      `
      insert into "organizationCacheIdentities"(id, name, website) values(:id, :name, :website)
      on conflict (name)
      do update
      set website = coalesce("organizationCacheIdentities".website, EXCLUDED.website)
      where "organizationCacheIdentities".website is null;
      `,
      {
        replacements: {
          id: record.id,
          name: data.name,
          website: data.website || null,
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async update(id, data, options: IRepositoryOptions, nameToCreateIdentity?: string) {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    let record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, ['url', 'enriched', ...OrganizationCacheRepository.COMMON_COLUMNS]),
      },
      {
        transaction,
      },
    )

    if (!record) {
      throw new Error404()
    }

    if (nameToCreateIdentity) {
      await seq.query(
        `
        insert into "organizationCacheIdentities" (id, name, website) values (:id, :name, :website)
        on conflict (name)
        do update
        set website = coalesce("organizationCacheIdentities".website, EXCLUDED.website)
        where "organizationCacheIdentities".website is null;
        `,
        {
          replacements: {
            id,
            name: nameToCreateIdentity,
            website: data.website || null,
          },
          type: QueryTypes.INSERT,
          transaction,
        },
      )
    }

    if (data.website) {
      await seq.query(
        `update "organizationCacheIdentities" set website = :website where id = :id and website is null`,
        {
          replacements: {
            id,
            website: data.website,
          },
          type: QueryTypes.UPDATE,
          transaction,
        },
      )
    }

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async bulkUpdate(
    data: any[],
    options: IRepositoryOptions,
    isEnrichment: boolean = false,
  ): Promise<void> {
    const transaction = SequelizeRepository.getTransaction(options)

    if (isEnrichment) {
      // Fetch existing organizations
      const existingRecords = await options.database.organizationCache.findAll({
        where: {
          id: {
            [options.database.Sequelize.Op.in]: data.map((x) => x.id),
          },
        },
        transaction,
      })

      // Merge existing tags with new tags instead of overwriting
      data = data.map((org) => {
        const existingOrg = existingRecords.find((record) => record.id === org.id)
        if (existingOrg && existingOrg.tags) {
          // Merge existing and new tags without duplicates
          org.tags = lodash.uniq([...org.tags, ...existingOrg.tags])
        }
        return org
      })
    }

    for (const org of data) {
      this.update(org.id, org, options)
    }
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    const record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await seq.query('delete from "organizationCacheIdentities" where id = :id', {
      replacements: {
        id,
        type: QueryTypes.DELETE,
        transaction,
      },
    })

    await record.destroy({
      transaction,
      force,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    const identityRows = await seq.query(
      `select name, website from "organizationCacheIdentities" where id = :id`,
      {
        replacements: {
          id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    const names = (identityRows as any[]).map((r) => r.name)
    // we just need one website since every identity should have the same website for the same organization cache
    const website = (identityRows as any[])
      .filter((r) => r.website !== null)
      .map((r) => r.website)
      .reduce((prev, curr) => {
        if (prev === null) {
          return curr
        }

        return prev
      }, null)

    const output = { ...record.get({ plain: true }), names, website }
    return output
  }

  static async findByUrl(url, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        url,
      },
      include,
      transaction,
      attributes: ['id'],
    })

    if (!record) {
      return undefined
    }

    return this.findById(record.id, options)
  }

  static async findByWebsite(website: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const result = await seq.query(
      `select id from "organizationCacheIdentities" where website = :website`,
      {
        replacements: {
          website,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (result.length === 1) {
      return this.findById((result[0] as any).id, options)
    }

    return undefined
  }

  static async findByName(name: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const seq = SequelizeRepository.getSequelize(options)

    const result = await seq.query(
      `select id from "organizationCacheIdentities" where name = :name`,
      {
        replacements: {
          name,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (result.length === 1) {
      return this.findById((result[0] as any).id, options)
    }

    return undefined
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
        entityName: 'organizationCache',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }
}

export default OrganizationCacheRepository
