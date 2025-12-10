import { QueryTypes } from 'sequelize'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

export default class GitReposRepository {
  /**
   * Soft deletes repositories from git.repositories table
   * @param integrationId The integration ID to delete repositories for
   * @param options Repository options
   */
  static async delete(integrationId: string, options: IRepositoryOptions) {
    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    await seq.query(
      `
        UPDATE git.repositories
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
  }

  /**
   * Upserts repositories into git.repositories table
   *
   * @param repositories - Array with id, url, integrationId, segmentId, forkedFrom (null preserves existing value)
   * @param options - Repository options
   */
  static async upsert(
    repositories: Array<{
      id: string
      url: string
      integrationId: string
      segmentId: string
      forkedFrom?: string | null
    }>,
    options: IRepositoryOptions,
  ) {
    if (!repositories || repositories.length === 0) {
      return
    }

    const seq = SequelizeRepository.getSequelize(options)
    const transaction = SequelizeRepository.getTransaction(options)

    // Build SQL placeholders and parameter replacements in a single loop
    const placeholders: string[] = []
    const replacements: Record<string, any> = {}

    repositories.forEach((repo, idx) => {
      // Build placeholder for this repository
      placeholders.push(
        `(:id_${idx}, :url_${idx}, :integrationId_${idx}, :segmentId_${idx}, :forkedFrom_${idx})`,
      )

      // Build replacements for this repository
      replacements[`id_${idx}`] = repo.id
      replacements[`url_${idx}`] = repo.url
      replacements[`integrationId_${idx}`] = repo.integrationId
      replacements[`segmentId_${idx}`] = repo.segmentId
      replacements[`forkedFrom_${idx}`] = repo.forkedFrom || null
    })

    const placeholdersString = placeholders.join(', ')

    await seq.query(
      `
        INSERT INTO git.repositories (id, url, "integrationId", "segmentId", "forkedFrom")
        VALUES ${placeholdersString}
        ON CONFLICT (id) DO UPDATE SET
          "integrationId" = EXCLUDED."integrationId",
          "segmentId" = EXCLUDED."segmentId",
          "forkedFrom" = COALESCE(EXCLUDED."forkedFrom", git.repositories."forkedFrom"),
          "updatedAt" = NOW(),
          "deletedAt" = EXCLUDED."deletedAt"
      `,
      {
        replacements,
        transaction,
      },
    )
  }
}
