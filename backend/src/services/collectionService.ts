import {
  CollectionField,
  ICollection,
  ICreateCollectionWithProjects,
  IInsightsProject,
  InsightsProjectField,
  addInsightsProjectsToCollection,
  countCollections,
  createCollection,
  createInsightsProject,
  deleteCollection,
  queryCollectionById,
  queryCollections,
  queryInsightsProjects,
  queryInsightsProjectsByCollectionIds,
} from '@crowd/data-access-layer/src/collections'
import { QueryFilter } from '@crowd/data-access-layer/src/query'
import { LoggerBase } from '@crowd/logging'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'

export class CollectionService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super()
    this.options = options
  }

  async createCollection(collection: ICreateCollectionWithProjects) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const createdCollection = await createCollection(qx, collection)

      await addInsightsProjectsToCollection(qx, createdCollection.id, collection.projects)

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findById(createdCollection.id)
    })
  }

  async findById(id: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      const collection = await queryCollectionById(qx, id, Object.values(CollectionField))
      const connections = await queryInsightsProjectsByCollectionIds(qx, [id])
      const projects = await queryInsightsProjects(qx, {
        filter: {
          id: {
            in: connections.map((c) => c.insightsProjectId),
          },
        },
        fields: Object.values(InsightsProjectField),
      })

      return {
        ...collection,
        projects: projects.map((p) => {
          const connection = connections.find((c) => c.insightsProjectId === p.id)

          if (!connection) {
            throw new Error(`Connection not found for project ${p.id}`)
          }

          return {
            ...p,
            connectionId: connection.id,
            starred: connection.starred,
          }
        }),
      }
    })
  }

  async destroy(id: string) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    await deleteCollection(qx, id)
  }

  async query({ limit, offset, filter }: { limit?: number; offset?: number; filter: QueryFilter }) {
    if (!limit) limit = 10
    if (!offset) offset = 0

    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const collections = await queryCollections(qx, {
      limit,
      offset,
      fields: Object.values(CollectionField),
      filter,
      orderBy: '"name" ASC',
    })

    if (collections.length === 0) {
      return {
        rows: [],
        total: 0,
        limit,
        offset,
      }
    }

    const connections = await queryInsightsProjectsByCollectionIds(
      qx,
      collections.map((c) => c.id),
    )

    const projects =
      connections.length > 0
        ? await queryInsightsProjects(qx, {
            filter: {
              id: { in: connections.map((c) => c.insightsProjectId) },
            },
            fields: Object.values(InsightsProjectField),
          })
        : []

    const total = await countCollections(qx, filter)

    return {
      rows: collections.map((c) => {
        const collectionConnections = connections.filter((cp) => cp.collectionId === c.id)
        return {
          ...c,
          projects: projects
            .filter((p) => collectionConnections.some((cp) => cp.insightsProjectId === p.id))
            .map((p) => {
              const connection = collectionConnections.find((cp) => cp.insightsProjectId === p.id)
              return {
                ...p,
                connectionId: connection?.id,
                starred: connection?.starred,
              }
            }),
        }
      }),
      total,
      limit,
      offset,
    }
  }

  async createInsightsProject(project: IInsightsProject) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const createdProject = await createInsightsProject(qx, project)
    return createdProject
  }
}
