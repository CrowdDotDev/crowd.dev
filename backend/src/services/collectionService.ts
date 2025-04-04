import { uniq } from 'lodash'

import { listCategoriesByIds } from '@crowd/data-access-layer/src/categories'
import {
  CollectionField,
  ICreateCollectionWithProjects,
  ICreateInsightsProject,
  InsightsProjectField,
  connectProjectsAndCollections,
  countCollections,
  countInsightsProjects,
  createCollection,
  createInsightsProject,
  deleteCollection,
  deleteInsightsProject,
  disconnectProjectsAndCollections,
  findCollectionProjectConnections,
  queryCollectionById,
  queryCollections,
  queryInsightsProjectById,
  queryInsightsProjects,
  updateCollection,
  updateInsightsProject,
} from '@crowd/data-access-layer/src/collections'
import { fetchIntegrationsForSegment } from '@crowd/data-access-layer/src/integrations'
import { OrganizationField, findOrgById, queryOrgs } from '@crowd/data-access-layer/src/orgs'
import { QueryFilter } from '@crowd/data-access-layer/src/query'
import { findSegmentById } from '@crowd/data-access-layer/src/segments'
import { LoggerBase } from '@crowd/logging'
import { PlatformType } from '@crowd/types'

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

      if (collection.projects) {
        await connectProjectsAndCollections(
          qx,
          collection.projects.map((p) => ({
            insightsProjectId: p.id,
            collectionId: createdCollection.id,
            starred: p.starred,
          })),
        )
      }

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findById(createdCollection.id)
    })
  }

  async updateCollection(id: string, collection: Partial<ICreateCollectionWithProjects>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      await updateCollection(qx, id, collection)

      if (collection.projects) {
        await disconnectProjectsAndCollections(qx, { collectionId: id })
        await connectProjectsAndCollections(
          qx,
          collection.projects.map((p) => ({
            insightsProjectId: p.id,
            collectionId: id,
            starred: p.starred,
          })),
        )
      }

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
    await SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      await disconnectProjectsAndCollections(qx, { collectionId: id })
      await deleteCollection(qx, id)
    })
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

    const categoryIds = uniq(collections.map((c) => c.categoryId))
    const categories = await listCategoriesByIds(qx, categoryIds)
    const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))

    return {
      rows: collections.map((c) => {
        const collectionConnections = connections.filter((cp) => cp.collectionId === c.id)
        return {
          ...c,
          category: categoryById[c.categoryId],
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

      if (project.collections) {
        await connectProjectsAndCollections(
          qx,
          project.collections.map((c) => ({
            insightsProjectId: createdProject.id,
            collectionId: c,
            starred: true,
          })),
        )
      }

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findInsightsProjectById(createdProject.id)
    })
  }

  async destroyInsightsProject(id: string) {
    await SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      await disconnectProjectsAndCollections(qx, { insightsProjectId: id })
      await deleteInsightsProject(qx, id)
    })
  }

  async findInsightsProjectById(id: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      const project = await queryInsightsProjectById(qx, id, Object.values(InsightsProjectField))
      const connections = await findCollectionProjectConnections(qx, {
        insightsProjectIds: [id],
      })

      const segment = project.segmentId ? await findSegmentById(qx, project.segmentId) : null
      const organization = project.organizationId
        ? await findOrgById(qx, project.organizationId, [
            OrganizationField.ID,
            OrganizationField.DISPLAY_NAME,
            OrganizationField.LOGO,
          ])
        : null

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
        segment: {
          id: segment?.id,
          name: segment?.name,
          slug: segment?.slug,
          logo: segment?.url,
        },
        organization: {
          id: organization?.id,
          displayName: organization?.displayName,
          logo: organization?.logo,
        },
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

  async updateInsightsProject(id: string, project: Partial<ICreateInsightsProject>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
      await updateInsightsProject(qx, id, project)

      if (project.collections) {
        await disconnectProjectsAndCollections(qx, { insightsProjectId: id })
        await connectProjectsAndCollections(
          qx,
          project.collections.map((c) => ({
            insightsProjectId: id,
            collectionId: c,
            starred: true,
          })),
        )
      }

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findInsightsProjectById(id)
    })
  }

  async findRepositoriesForSegment(segmentId: string) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const integrations = await fetchIntegrationsForSegment(qx, segmentId)

    // Initialize result with platform arrays
    const result: Record<string, Array<{ url: string; label: string }>> = {
      git: [],
      github: [],
      gitlab: [],
      gerrit: [],
    }

    const addToResult = (platform: PlatformType, fullUrl: string, label: string) => {
      const platformKey = platform.toLowerCase()
      if (!result[platformKey].some((item) => item.url === fullUrl)) {
        result[platformKey].push({ url: fullUrl, label })
      }
    }

    for (const i of integrations) {
      if (i.platform === PlatformType.GITHUB) {
        for (const org of (i.settings as any).orgs) {
          for (const repo of org.repos) {
            const label = `${org.name}/${repo.name}`
            const fullUrl = `https://github.com/${label}`
            addToResult(i.platform, fullUrl, label)
          }
        }
      }

      if (i.platform === PlatformType.GIT) {
        for (const r of (i.settings as any).remotes) {
          let label = r
          if (r.includes('https://gitlab.com/')) {
            label = r.replace('https://gitlab.com/', '')
          } else if (r.includes('https://github.com/')) {
            label = r.replace('https://github.com/', '')
          }
          addToResult(i.platform, r, label)
        }
      }

      if (i.platform === PlatformType.GITLAB) {
        for (const group of Object.values((i.settings as any).groupProjects) as any[]) {
          for (const r of group) {
            const label = r.path_with_namespace
            const fullUrl = `https://gitlab.com/${label}`
            addToResult(i.platform, fullUrl, label)
          }
        }
      }

      if (i.platform === PlatformType.GERRIT) {
        for (const r of (i.settings as any).remote.repos) {
          addToResult(i.platform, r, r)
        }
      }
    }

    return result
  }
}
