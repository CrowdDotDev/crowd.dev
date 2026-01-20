import trim from 'lodash/trim'
import { QueryTypes } from 'sequelize'

import { DEFAULT_TENANT_ID, Error400 } from '@crowd/common'
import { RedisCache } from '@crowd/redis'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class GitlabReposRepository {
  private static getCache(options: IRepositoryOptions): RedisCache {
    return new RedisCache('gitlabRepos', options.redis, options.log)
  }

  private static async bulkInsert(
    table,
    columns,
    placeholdersFn,
    values,
    options: IRepositoryOptions,
  ) {
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
    const transaction = SequelizeRepository.getTransaction(options)

    // Check for repositories already mapped to other integrations
    for (const url of Object.keys(mapping)) {
      const existingRows = await options.database.sequelize.query(
        `SELECT * FROM "gitlabRepos" WHERE url = :url AND "deletedAt" IS NULL`,
        {
          replacements: { url },
          type: QueryTypes.SELECT,
          transaction,
        },
      )

      for (const row of existingRows as any[]) {
        if (!row.deletedAt && row.integrationId !== integrationId) {
          options.log.warn(
            `Trying to update gitlab repo ${row.url} mapping with integrationId ${integrationId} but it is already mapped to integration ${row.integrationId}!`,
          )

          throw new Error400(
            options.language,
            'errors.integrations.repoAlreadyMapped',
            row.url,
            integrationId,
            row.integrationId,
          )
        }
      }
    }
    await GitlabReposRepository.bulkInsert(
      'gitlabRepos',
      ['tenantId', 'integrationId', 'segmentId', 'url'],
      (idx) => `(:tenantId_${idx}, :integrationId_${idx}, :segmentId_${idx}, :url_${idx})`,
      Object.entries(mapping).map(([url, segmentId], idx) => ({
        [`tenantId_${idx}`]: DEFAULT_TENANT_ID,
        [`integrationId_${idx}`]: integrationId,
        [`segmentId_${idx}`]: segmentId,
        [`url_${idx}`]: url,
      })),
      options,
    )

    await this.getCache(options).deleteAll()
  }

  static async hasMappedRepos(segmentId: string, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const result = await options.database.sequelize.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM "gitlabRepos" r
          WHERE r."segmentId" = :segmentId
          AND r."deletedAt" is null
          LIMIT 1
        ) as has_repos
      `,
      {
        replacements: {
          segmentId,
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

    await seq.query(
      `
        UPDATE "gitlabRepos"
        SET "deletedAt" = NOW()
        WHERE "integrationId" = :integrationId
      `,
      {
        replacements: {
          integrationId,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )

    await this.getCache(options).deleteAll()
  }
}
