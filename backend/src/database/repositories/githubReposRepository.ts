import trim from 'lodash/trim'
import { QueryTypes } from 'sequelize'

import { DEFAULT_TENANT_ID, Error400 } from '@crowd/common'
import { RedisCache } from '@crowd/redis'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class GithubReposRepository {
  private static getCache(options: IRepositoryOptions): RedisCache {
    return new RedisCache('githubRepos', options.redis, options.log)
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
                      "integrationId" = EXCLUDED."integrationId",
                      "deletedAt" = NULL
      `,
      {
        replacements,
        transaction,
      },
    )
  }

  static async updateMapping(integrationId, mapping, options: IRepositoryOptions) {
    const mappingEntries = Object.entries(mapping).map(([url, segmentId]) => ({
      url: url as string,
      segmentId: segmentId as string,
    }))

    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    const existingRows = await seq.query(
      `
        select * from "githubRepos" where "tenantId" = :tenantId and "url" in (:urls)
      `,
      {
        replacements: {
          tenantId: DEFAULT_TENANT_ID,
          urls: mappingEntries.map((e) => e.url),
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    for (const row of existingRows as any[]) {
      if (!row.deletedAt && row.integrationId !== integrationId) {
        options.log.warn(
          `Trying to update github repo ${row.url} mapping with integrationId ${integrationId} but it is already mapped to integration ${row.integrationId}!`,
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

    await GithubReposRepository.bulkInsert(
      'githubRepos',
      ['tenantId', 'integrationId', 'segmentId', 'url'],
      (idx) => `(:tenantId_${idx}, :integrationId_${idx}, :segmentId_${idx}, :url_${idx})`,
      mappingEntries.map(({ url, segmentId }, idx) => ({
        [`tenantId_${idx}`]: DEFAULT_TENANT_ID,
        [`integrationId_${idx}`]: integrationId,
        [`segmentId_${idx}`]: segmentId,
        [`url_${idx}`]: url,
      })),
      options,
    )

    await this.getCache(options).deleteAll()
  }

  static async delete(integrationId, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    await seq.query(
      `
        UPDATE "githubRepos"
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
