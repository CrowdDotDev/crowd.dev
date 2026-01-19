import { uniq } from 'lodash'

import { getCleanString } from '@crowd/common'
import { GithubIntegrationService } from '@crowd/common_services'
import { OrganizationField, QueryExecutor, findOrgById, queryOrgs } from '@crowd/data-access-layer'
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
import { QueryFilter } from '@crowd/data-access-layer/src/query'
import {
  ICreateRepositoryGroup,
  IRepositoryGroup,
  createRepositoryGroup,
  deleteRepositoryGroup,
  listRepositoryGroups,
  updateRepositoryGroup,
} from '@crowd/data-access-layer/src/repositoryGroups'
import { findSegmentById, hasMappedRepos } from '@crowd/data-access-layer/src/segments'
import { QueryResult } from '@crowd/data-access-layer/src/utils'
import { GithubIntegrationSettings } from '@crowd/integrations'
import { LoggerBase } from '@crowd/logging'
import { DEFAULT_WIDGET_VALUES, PlatformType, Widgets } from '@crowd/types'

import SegmentRepository from '@/database/repositories/segmentRepository'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { IGithubInsights } from '@/types/githubTypes'

import { IServiceOptions } from './IServiceOptions'

export class CollectionService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super()
    this.options = options
  }

  async createCollection(collection: ICreateCollectionWithProjects) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })

      const slug = collection.slug ?? getCleanString(collection.name).replace(/\s+/g, '-')

      const createdCollection = await createCollection(qx, {
        ...collection,
        slug,
      })

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
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
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
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
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
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
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

  async createInsightsProject(project: Partial<ICreateInsightsProject>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
      const slug = getCleanString(project.name).replace(/\s+/g, '-')

      const segment = project.segmentId ? await findSegmentById(qx, project.segmentId) : null

      const createdProject = await createInsightsProject(qx, {
        ...project,
        isLF: segment?.isLF ?? false,
        slug,
      })

      if (project.collections) {
        await connectProjectsAndCollections(
          qx,
          project.collections.map((c) => ({
            insightsProjectId: createdProject.id,
            collectionId: c,
            starred: project.starred ?? true,
          })),
        )
      }

      await this.syncRepositoryGroupsWithDb(qx, createdProject.id, project.repositoryGroups)

      const txSvc = new CollectionService({ ...this.options, transaction: tx })

      return txSvc.findInsightsProjectById(createdProject.id)
    })
  }

  async destroyInsightsProject(id: string) {
    await SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
      await disconnectProjectsAndCollections(qx, { insightsProjectId: id })
      await deleteInsightsProject(qx, id)
    })
  }

  async findInsightsProjectById(id: string) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
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
      const repositoryGroups = await listRepositoryGroups(qx, { insightsProjectId: id })

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
        repositoryGroups,
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
      limit,
      offset,
      fields: Object.values(InsightsProjectField),
      orderBy: '"name" ASC',
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

  static normalizeRepositories(
    repositories?: string[] | { platform: string; url: string }[],
  ): string[] {
    if (!repositories || repositories.length === 0) return []

    return typeof repositories[0] === 'string'
      ? (repositories as string[])
      : (repositories as { platform: string; url: string }[]).map((r) => r.url)
  }

  async updateInsightsProject(insightsProjectId: string, project: Partial<ICreateInsightsProject>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })

      // If segmentId is being updated, fetch the new segment's isLF value
      if (project.segmentId) {
        const segment = await findSegmentById(qx, project.segmentId)
        project.isLF = segment?.isLF ?? false
      }

      await updateInsightsProject(qx, insightsProjectId, project)

      if (project.collections) {
        await disconnectProjectsAndCollections(qx, { insightsProjectId })
        await connectProjectsAndCollections(
          qx,
          project.collections.map((c) => ({
            collectionId: c,
            insightsProjectId,
            starred: project.starred ?? true,
          })),
        )
      }

      await this.syncRepositoryGroupsWithDb(qx, insightsProjectId, project.repositoryGroups)

      const txSvc = new CollectionService({
        ...this.options,
        transaction: tx,
      })
      return txSvc.findInsightsProjectById(insightsProjectId)
    })
  }

  /**
   * Synchronizes repository groups with the database by creating, updating, or deleting groups based on the provided input.
   *
   * @param {QueryExecutor} qx - The query executor used to perform database operations.
   * @param {string} insightsProjectId - The ID of the insights project to which the repository groups belong.
   * @param {ICreateRepositoryGroup[]} repositoryGroups - The array of repository group objects to be synchronized with the database.
   * @return {Promise<IRepositoryGroup[]>} A promise that resolves to the list of repository groups currently in the database after synchronization.
   */
  // eslint-disable-next-line class-methods-use-this
  async syncRepositoryGroupsWithDb(
    qx: QueryExecutor,
    insightsProjectId: string,
    repositoryGroups: ICreateRepositoryGroup[],
  ): Promise<IRepositoryGroup[]> {
    const rg = repositoryGroups || []
    // Get existing repository groups for the given insights project
    const existingRepositoryGroups = await listRepositoryGroups(qx, { insightsProjectId })

    // Extract IDs of existing repository groups
    const existingIds: string[] = existingRepositoryGroups.map((rg) => rg.id)

    // Extract IDs of repository groups to be synchronized
    const repositoryGroupIds: string[] = rg.map((rg) => rg.id) as string[]

    // Find repository groups that need to be updated (exist in both lists)
    const toUpdate: ICreateRepositoryGroup[] = rg.filter((rg) => existingIds.includes(rg.id))

    // Find repository groups that need to be created (don't exist or have no ID)
    const toCreate: ICreateRepositoryGroup[] = rg.filter(
      (rg) => !rg.id || !existingIds.includes(rg.id),
    )

    // Find repository groups that need to be deleted (exist but not in new list)
    const toDelete: string[] = existingIds.filter((id) => !repositoryGroupIds.includes(id))

    // Create new repository groups
    if (toCreate.length > 0) {
      for (const rg of toCreate) {
        const slug = getCleanString(rg.name).replace(/\s+/g, '-')
        await createRepositoryGroup(qx, {
          ...rg,
          slug,
          insightsProjectId,
        })
      }
    }

    // Delete repository groups that are no longer needed
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await deleteRepositoryGroup(qx, id)
      }
    }

    // Update existing repository groups with new data
    if (toUpdate.length > 0) {
      for (const rg of toUpdate) {
        const slug = getCleanString(rg.name).replace(/\s+/g, '-')
        await updateRepositoryGroup(qx, rg.id, {
          ...rg,
          slug,
        })
      }
    }

    // Return the updated list of repository groups from the database
    return listRepositoryGroups(qx, { insightsProjectId })
  }

  static isSingleRepoOrg(orgs: GithubIntegrationSettings['orgs']): boolean {
    return (
      Array.isArray(orgs) &&
      orgs.length === 1 &&
      Array.isArray(orgs[0]?.repos) &&
      orgs[0].repos.length === 1
    )
  }

  async findGithubInsightsForSegment(segmentId: string): Promise<IGithubInsights> {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
      const integrations = await fetchIntegrationsForSegment(qx, segmentId)
      const segment = await findSegmentById(qx, segmentId)

      const [githubIntegration] = integrations.filter(
        (integration) =>
          integration.platform === PlatformType.GITHUB ||
          integration.platform === PlatformType.GITHUB_NANGO,
      )

      if (!githubIntegration) {
        return null
      }

      const settings = githubIntegration.settings as GithubIntegrationSettings

      // The orgs must have at least one repo
      if (
        !settings?.orgs ||
        !Array.isArray(settings.orgs) ||
        settings.orgs.length === 0 ||
        !Array.isArray(settings.orgs[0].repos) ||
        settings.orgs[0].repos.length === 0
      ) {
        return null
      }

      const mainOrg = await GithubIntegrationService.findMainGithubOrganizationWithLLM(
        qx,
        segment.name,
        settings.orgs,
      )

      if (!mainOrg) {
        return null
      }

      const details = CollectionService.isSingleRepoOrg(settings.orgs)
        ? await GithubIntegrationService.findRepoDetails(
            mainOrg.name,
            settings.orgs[0].repos[0].name,
          )
        : {
            ...(await GithubIntegrationService.findOrgDetails(mainOrg.name)),
            topics: mainOrg.topics,
          }

      if (!details) {
        return null
      }

      return {
        description: mainOrg.description,
        github: details.github,
        logoUrl: details.logoUrl,
        name: segment.name,
        topics: details.topics,
        twitter: details.twitter,
        website: details.website,
      }
    })
  }

  private static isValidPlatform(value: unknown): value is PlatformType {
    return typeof value === 'string' && Object.values(PlatformType).includes(value as PlatformType)
  }

  async findSegmentsWidgetsById(
    segmentId: string,
  ): Promise<{ platforms: PlatformType[]; widgets: Widgets[] }> {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
      const widgets = new Set<Widgets>()
      const integrations = await fetchIntegrationsForSegment(qx, segmentId)
      const platforms = [
        ...new Set(
          integrations
            .map((integration) => integration.platform)
            .filter(CollectionService.isValidPlatform),
        ),
      ]

      // Check for mapped repositories and add GitHub if there are any
      const hasGithubMappedRepos = await hasMappedRepos(qx, segmentId, [
        PlatformType.GITHUB,
        PlatformType.GITHUB_NANGO,
      ])
      if (hasGithubMappedRepos && !platforms.includes(PlatformType.GITHUB)) {
        platforms.push(PlatformType.GITHUB)
      }

      for (const platform of platforms) {
        Object.entries(DEFAULT_WIDGET_VALUES).forEach(([key, config]) => {
          if (
            config.enabled &&
            config.platform.some((p) => p.toLowerCase() === platform.toLowerCase())
          ) {
            widgets.add(key as Widgets)
          }
        })
      }

      return {
        platforms,
        widgets: [...widgets],
      }
    })
  }

  async findInsightsProjectsBySegmentId(
    segmentId: string,
  ): Promise<QueryResult<InsightsProjectField>[]> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const result = await queryInsightsProjects(qx, {
      filter: {
        segmentId: { eq: segmentId },
      },
      fields: Object.values(InsightsProjectField),
    })

    return result
  }

  async findInsightsProjectsBySlug(slug: string): Promise<QueryResult<InsightsProjectField>[]> {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const normalizedSlug = slug.replace(/^nonlf_/, '')

    const result = await queryInsightsProjects(qx, {
      filter: {
        slug: { eq: normalizedSlug },
        segmentId: { eq: null },
      },
      fields: Object.values(InsightsProjectField),
    })

    return result
  }
}
