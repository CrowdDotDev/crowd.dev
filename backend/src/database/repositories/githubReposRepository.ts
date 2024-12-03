import trim from 'lodash/trim'
import { QueryTypes } from 'sequelize'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class GithubReposRepository {
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

  static async updateMapping(
    integrationId,
    newMapping: Record<string, string>,
    oldMapping: {
      url: string
      segment: {
        id: string
        name: string
      }
    }[],
    options: IRepositoryOptions,
  ) {
    const tenantId = options.currentTenant.id
    const transaction = SequelizeRepository.getTransaction(options)
    const seq = SequelizeRepository.getSequelize(options)

    // Create maps for efficient lookup
    const oldMappingMap = new Map(oldMapping.map(m => [m.url, m.segment.id]))
    const newMappingEntries = Object.entries(newMapping)

    // Find repos to insert or update (where they didn't exist or segment changed)
    const reposToUpsert = newMappingEntries.filter(([url, segmentId]) => {
      const oldSegmentId = oldMappingMap.get(url)
      return !oldSegmentId || oldSegmentId !== segmentId
    })

    if (reposToUpsert.length > 0) {
      await GithubReposRepository.bulkInsert(
        'githubRepos',
        ['tenantId', 'integrationId', 'segmentId', 'url'],
        (idx) => `(:tenantId_${idx}, :integrationId_${idx}, :segmentId_${idx}, :url_${idx})`,
        reposToUpsert.map(([url, segmentId], idx) => ({
          [`tenantId_${idx}`]: tenantId,
          [`integrationId_${idx}`]: integrationId,
          [`segmentId_${idx}`]: segmentId,
          [`url_${idx}`]: url,
        })),
        options,
      )
    }

    // Find repos that were removed (exist in old but not in new)
    const newUrlSet = new Set(Object.keys(newMapping))
    const urlsToRemove = oldMapping
      .filter(m => !newUrlSet.has(m.url))
      .map(m => m.url)

    if (urlsToRemove.length > 0) {
      await seq.query(
        `
        UPDATE "githubRepos"
        SET "deletedAt" = NOW()
        WHERE "tenantId" = :tenantId
        AND "integrationId" = :integrationId
        AND "url" IN (:urls)
        AND "deletedAt" IS NULL
        `,
        {
          replacements: {
            tenantId,
            integrationId,
            urls: urlsToRemove,
          },
          transaction,
        },
      )
    }
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
        FROM "githubRepos" r
        JOIN segments s ON s.id = r."segmentId"
        WHERE r."integrationId" = :integrationId
        AND r."tenantId" = :tenantId
        AND r."deletedAt" is null
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
          FROM "githubRepos" r
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
        UPDATE "githubRepos"
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
