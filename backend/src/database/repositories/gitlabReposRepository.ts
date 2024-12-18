import trim from 'lodash/trim'
import { QueryTypes } from 'sequelize'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class GitlabReposRepository {
  static async bulkInsert(table, columns, placeholdersFn, values, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    columns = columns.map((column) => trim(column, '"')).map((column) => `"${column}"`)
    const joinedColumns = columns.join(', ')

    const placeholders = values.map((value, idx) => placeholdersFn(idx))

    const replacements = values.reduce((acc, value) => {
      Object.entries(value).forEach(([key, value]) => {
        acc[key] = value
      })
      return acc
    }, {})

    return seq.query(
      `
        INSERT INTO "${table}"
        (${joinedColumns})
        VALUES ${placeholders.join(', ')}
        ON CONFLICT ("tenantId", "url")
        DO UPDATE SET "segmentId" = EXCLUDED."segmentId",
                      "integrationId" = EXCLUDED."integrationId"
      `,
      {
        replacements,
        transaction,
      },
    )
  }

  static async updateMapping(integrationId, mapping, options: IRepositoryOptions) {
    const tenantId = options.currentTenant.id

    await GitlabReposRepository.bulkInsert(
      'gitlabRepos',
      ['tenantId', 'integrationId', 'segmentId', 'url'],
      (idx) => `(:tenantId_${idx}, :integrationId_${idx}, :segmentId_${idx}, :url_${idx})`,
      Object.entries(mapping).map(([url, segmentId], idx) => ({
        [`tenantId_${idx}`]: tenantId,
        [`integrationId_${idx}`]: integrationId,
        [`segmentId_${idx}`]: segmentId,
        [`url_${idx}`]: url,
      })),
      options,
    )
  }

  static async getMapping(integrationId, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    const results = await options.database.sequelize.query(
      `
        SELECT
          r.url,
          JSONB_BUILD_OBJECT(
            'id', s.id,
            'name', s.name
          ) as "segment"
        FROM "gitlabRepos" r
        JOIN segments s ON s.id = r."segmentId"
        WHERE r."integrationId" = :integrationId
        AND r."tenantId" = :tenantId
      `,
      {
        replacements: {
          integrationId,
          tenantId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return results
  }

  static async hasMappedRepos(segmentId: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    const result = await options.database.sequelize.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM "gitlabRepos" r
          WHERE r."segmentId" = :segmentId
          AND r."tenantId" = :tenantId
          LIMIT 1
        ) as has_repos
      `,
      {
        replacements: {
          segmentId,
          tenantId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return result[0].has_repos
  }

  static async delete(integrationId, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    await seq.query(
      `
        UPDATE "gitlabRepos"
        SET "deletedAt" = NOW()
        WHERE "integrationId" = :integrationId
          AND "tenantId" = :tenantId
      `,
      {
        replacements: {
          integrationId,
          tenantId,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )
  }
}
