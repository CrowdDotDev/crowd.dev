import { uniq } from 'lodash'

import {
  CollectionField,
  ICreateCollection,
  ICreateCollectionWithProjects,
  ICreateInsightsProject,
  IInsightsProject,
  InsightsProjectField,
  addInsightsProjectsToCollection,
  countCollections,
  countInsightsProjects,
  createCollection,
  createInsightsProject,
  deleteCollection,
  deleteInsightsProject,
  findCollectionProjectConnections,
  queryCollectionById,
  queryCollections,
  queryInsightsProjectById,
  queryInsightsProjects,
  updateCollection,
} from '@crowd/data-access-layer/src/collections'
import { OrganizationField, queryOrgs } from '@crowd/data-access-layer/src/orgs'
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

      await addInsightsProjectsToCollection(qx, createdCollection.id, collection.projects || [])

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findById(createdCollection.id)
    })
  }

  async updateCollection(id: string, collection: Partial<ICreateCollection>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      await updateCollection(qx, id, collection)

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findById(id)
    })
  }

  async findById(id: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      const collection = await queryCollectionById(qx, id, Object.values(CollectionField))
      const connections = await findCollectionProjectConnections(qx, {
        collectionIds: [id],
      })
      const projects = connections.length
        ? await queryInsightsProjects(qx, {
            filter: {
              id: {
                in: connections.map((c) => c.insightsProjectId),
              },
            },
            fields: Object.values(InsightsProjectField),
          })
        : []

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

    const connections = await findCollectionProjectConnections(qx, {
      collectionIds: uniq(collections.map((c) => c.id)),
    })

    const projects =
      connections.length > 0
        ? await queryInsightsProjects(qx, {
            filter: {
              id: { in: uniq(connections.map((c) => c.insightsProjectId)) },
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

  async createInsightsProject(project: ICreateInsightsProject) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      const createdProject = await createInsightsProject(qx, project)

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findInsightsProjectById(createdProject.id)
    })
  }

  async destroyInsightsProject(id: string) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    await deleteInsightsProject(qx, id)
  }

  async findInsightsProjectById(id: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      const project = await queryInsightsProjectById(qx, id, Object.values(InsightsProjectField))
      const connections = await findCollectionProjectConnections(qx, {
        insightsProjectIds: [id],
      })

      const collections =
        connections.length > 0
          ? await queryCollections(qx, {
              filter: {
                id: { in: uniq(connections.map((c) => c.collectionId)) },
              },
              fields: Object.values(CollectionField),
            })
          : []

      return {
        ...project,
        collections,
      }
    })
  }

  async queryInsightsProjects({
    limit,
    offset,
    filter,
  }: {
    limit?: number
    offset?: number
    filter: QueryFilter
  }) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const projects = await queryInsightsProjects(qx, {
      filter,
      fields: Object.values(InsightsProjectField),
    })

    if (projects.length === 0) {
      return {
        rows: [],
        total: 0,
        limit,
        offset,
      }
    }

    const connections = await findCollectionProjectConnections(qx, {
      insightsProjectIds: projects.map((p) => p.id),
    })

    const organizations = await queryOrgs(qx, {
      filter: {
        id: { in: uniq(projects.map((p) => p.organizationId)) },
      },
      fields: [OrganizationField.ID, OrganizationField.DISPLAY_NAME, OrganizationField.LOGO],
    })

    const collections =
      connections.length > 0
        ? await queryCollections(qx, {
            filter: {
              id: { in: uniq(connections.map((c) => c.collectionId)) },
            },
            fields: Object.values(CollectionField),
          })
        : []

    const total = await countInsightsProjects(qx, filter)

    return {
      rows: projects.map((p) => {
        const collectionConnections = connections.filter((cp) => cp.insightsProjectId === p.id)
        return {
          ...p,
          collections: collections.filter((c) =>
            collectionConnections.some((cp) => cp.collectionId === c.id),
          ),
          organization: organizations.find((o) => o.id === p.organizationId),
        }
      }),
      total,
      limit,
      offset,
    }
  }
}
