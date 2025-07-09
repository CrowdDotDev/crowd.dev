import { uniq } from 'lodash'

import { getCleanString } from '@crowd/common'
import { LlmService } from '@crowd/common_services'
import { QueryExecutor } from '@crowd/data-access-layer'
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
import { QueryResult } from '@crowd/data-access-layer/src/utils'
import { GithubIntegrationSettings } from '@crowd/integrations'
import { LoggerBase, getServiceLogger } from '@crowd/logging'
import { DEFAULT_WIDGET_VALUES, PlatformType, Widgets } from '@crowd/types'

import SegmentRepository from '@/database/repositories/segmentRepository'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { IGithubInsights } from '@/types/githubTypes'

import { IServiceOptions } from './IServiceOptions'
import GithubIntegrationService from './githubIntegrationService'

const CATEGORY_STRUCTURE_TEXT = `
Creative & Design Tools                          | horizontal
 Programming Languages & Frameworks               | horizontal
 Operating Systems & Virtualization               | horizontal
 Artificial Intelligence & Machine Learning       | horizontal
 Developer Tools                                  | horizontal
 Privacy Tools                                    | horizontal
 Computer Science Fundamentals                    | horizontal
 Application Definition and Development           | horizontal
 Data Infrastructure & Analytics                  | horizontal
 Security & Privacy                               | horizontal
 Observability & Analysis                         | horizontal
 Runtime                                          | horizontal
 Provisioning                                     | horizontal
 End‑User Applications                            | horizontal
 Blockchain & Distributed Ledger                  | horizontal
 Networking                                       | horizontal
 User Interface & Applications                    | horizontal
 Business Intelligence & Analytics                | horizontal
 Orchestration & Management                       | horizontal
 Business Automation & Decision Management        | horizontal
 Scientific Computing & Engineering               | horizontal
 Web & CMS Development                            | horizontal
 Embedded Systems & Hardware                      | horizontal
 Community & Collaboration                        | horizontal
 Peripherals & Hardware Integration               | horizontal
 Developer Resources                              | horizontal
 Web Platforms                                    | horizontal
 Compatibility & Emulation                        | horizontal
 User Environment                                 | horizontal
 Communication Infrastructure                     | horizontal
 Collaboration & Social Platforms                 | horizontal
 Hardware Design & Automation                     | horizontal
 Decentralized Technologies                       | horizontal
 Interactive Entertainment                        | horizontal
 Game Development                                 | horizontal
 Geospatial Software                              | horizontal
 Hardware & Embedded                              | horizontal
 Home Automation & IoT                            | horizontal
 Smart Home & IoT                                 | horizontal
 IT Operations & Management                       | horizontal
 Enterprise IT Operations & Management            | horizontal
 Internet of Things                               | horizontal
 Data Repositories                                | horizontal
 Automation & Workflow Tools                      | horizontal
 Scientific & Medical Applications                | horizontal
 Self-Hosted Solutions                            | horizontal
 Software Discovery                               | horizontal
 Digital Presence & Marketing                     | horizontal
 Digital Identifier Infrastructure                | horizontal
 Product Intelligence & Experimentation           | horizontal
 Business & Productivity                          | horizontal
 Quantum Computing                                | horizontal
 Personal Productivity & Research                 | horizontal
 Microsoft Ecosystem Development                  | horizontal
 Signal Processing & Communications               | horizontal
 Enterprise Middleware                            | horizontal
 Systems & Infrastructure                         | horizontal
 Download Management                              | horizontal
 Arts & Culture                                   | vertical
 Communication & Collaboration                    | horizontal
 Surveillance & Video Analytics                   | horizontal
 Multimedia & Creative Tools                      | horizontal
 End-User Applications                            | horizontal
 Web Foundations                                  | horizontal
 Business Automation & Integration                | horizontal
 Sales Tools                                      | vertical
 Marketing Software                               | vertical
 B2B Marketplaces                                 | vertical
 Commerce Software                                | vertical
 Customer Service Software                        | vertical
 CAD & PLM Software                               | vertical
 ERP Software                                     | vertical
 HR Software                                      | vertical
 Office Management Software                       | vertical
 Supply Chain & Logistics Software                | vertical
 Digital Advertising Tech                         | vertical
 Finance & Fintech                                | vertical
 Healthcare & Life Sciences                       | vertical
 Government & Public Sector                       | vertical
 Climate Tech & Sustainability                    | vertical
 Education & Academia                             | vertical
 Gaming & eSports Solutions                       | vertical
 Robotics & Autonomous Systems                    | vertical
 Science & Research                               | vertical
 Digital Media & Entertainment                    | vertical
 Geospatial & Mapping                             | vertical
 Collaboration & Productivity                     | vertical
 Digital Fabrication & Manufacturing              | vertical
 Self-Hosted Solutions                            | vertical
 Smart Home                                       | vertical
 Self‑Hosted Solutions                            | vertical
 Digital Media & Entertainment Software           | vertical
 Community & Engagement                           | vertical
 Publishing & Scholarly Communication             | vertical
 Metaverse & Virtual Worlds                       | vertical
 Field & Mobile Solutions                         | vertical
 Cultural Heritage & Libraries                    | vertical
 End‑User Applications                            | vertical
 Customer Experience & Engagement                 | vertical
 Architecture, Engineering & Construction         | vertical
 Accessibility Solutions                          | vertical
 Internet of Things                               | vertical
 Hobby & Leisure                                  | vertical
 Creative Industries                              | vertical
 Transportation & Mobility                        | vertical
 Telecommunications                               | vertical
 Automotive & Transportation                      | vertical
 Privacy Tools                                    | vertical
 Social & Community                               | vertical
 Electronic and Semiconductor Design              | vertical
 Gaming & E-Sports Solutions                      | vertical
 Language Industry Solutions                      | vertical
 Blockchain Governance                            | vertical
 Electronics & Semiconductor                      | vertical
 Religious & Nonprofit Solutions                  | vertical
 Energy & Natural Resources                       | vertical
 Event Management & Scheduling                    | vertical
 Security Training & Awareness                    | vertical
 Lifestyle & Productivity                         | vertical
 Digital Media & Broadcast                        | vertical
 Academic Research & Scholarly Communication      | vertical
 Digital Media & Publishing                       | vertical
 Inclusive & Accessible Software                  | vertical
 Recreation & Lifestyle                           | vertical
 Geospatial & Remote Sensing                      | vertical
 Food, Nutrition & Agriculture                    | vertical
 Digital Twins & Simulation                       | vertical
 Smart Home & IoT                                 | vertical
 Events & Conferences                             | vertical
 Nonprofit & Social Impact                        | vertical
 Business Process Management                      | vertical
 Cybersecurity                                    | vertical
 Scholarly Communication and Digital Preservation | vertical
 Collaborative Decision Making                    | vertical
 Press & Journalism                               | vertical
 Web & CMS Development                            | vertical
 Gaming Industry                                  | vertical
 Field Solutions                                  | vertical
 Scientific & Research Solutions                  | vertical
 Academic Research Tools                          | vertical
 Social & Collaborative Solutions                 | vertical
 Community & Social Platforms                     | vertical
 Industry Specific Solutions                      | vertical
 Business Applications                            | vertical
 3D Printing & Digital Fabrication                | vertical
 Decentralized Finance                            | vertical
 Operating Systems & Virtualization               | vertical
 Application Definition and Development           | vertical
 Scientific Computing & Engineering               | vertical
 Industrial Automation & Control                  | vertical
 Blockchain & Distributed Ledger                  | vertical
 Open Data & Research                             | vertical
 Artificial Intelligence & Machine Learning       | vertical
 Global                                           | vertical
`

export class CollectionService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super()
    this.options = options
  }

  async createCollection(collection: ICreateCollectionWithProjects) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

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

  async createInsightsProject(project: Partial<ICreateInsightsProject>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
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

      const txSvc = new CollectionService({ ...this.options, transaction: tx })

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
      console.log('VAAAAMOLA')

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

  async updateInsightsProject(id: string, project: Partial<ICreateInsightsProject>) {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)

      // If segmentId is being updated, fetch the new segment's isLF value
      if (project.segmentId) {
        const segment = await findSegmentById(qx, project.segmentId)
        project.isLF = segment?.isLF ?? false
      }

      await updateInsightsProject(qx, id, project)

      if (project.collections) {
        await disconnectProjectsAndCollections(qx, { insightsProjectId: id })
        await connectProjectsAndCollections(
          qx,
          project.collections.map((c) => ({
            insightsProjectId: id,
            collectionId: c,
            starred: project.starred ?? true,
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
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
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

      // Add mapped repositories to GitHub platform
      const segmentRepository = new SegmentRepository(this.options)
      const mappedRepos = await segmentRepository.getMappedRepos(segmentId)

      for (const repo of mappedRepos) {
        const url = repo.url
        try {
          const parsedUrl = new URL(url)
          if (parsedUrl.hostname === 'github.com') {
            const label = parsedUrl.pathname.slice(1) // removes leading '/'
            addToResult(PlatformType.GITHUB, url, label)
          }
        } catch (err) {
          // Do nothing
        }
      }

      for (const i of integrations) {
        if (i.platform === PlatformType.GIT) {
          for (const r of (i.settings as any).remotes) {
            try {
              const url = new URL(r)
              let label = r

              if (url.hostname === 'gitlab.com') {
                label = url.pathname.slice(1)
              } else if (url.hostname === 'github.com') {
                label = url.pathname.slice(1)
              }

              addToResult(i.platform, r, label)
            } catch {
              this.options.log.warn(`Invalid URL in remotes: ${r}`)
            }
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
          for (const r of (i.settings as any).remote.repoNames) {
            addToResult(i.platform, `${(i.settings as any).remote.orgURL}/q/project:${r}`, r)
          }
        }
      }

      return result
    })
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
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
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
      const qx = SequelizeRepository.getQueryExecutor(this.options, tx)
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
      const segmentRepository = new SegmentRepository(this.options)
      const hasMappedRepos = await segmentRepository.hasMappedRepos(segmentId)
      if (hasMappedRepos && !platforms.includes(PlatformType.GITHUB)) {
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


  public static async findRepoCategoriesWithLLM(
    qx: QueryExecutor,
    repo_url: string,
    repo_description: string,
    repo_topics: string[],
    repo_homepage: string,
  ): Promise<string[]> {

    const prompt = `You are an expert open-source analyst. Your job is to classify ${repo_url} into appropriate categories.

      ## Context and Purpose
      This classification is part of the Open Source Index, a comprehensive catalog of the most critical open-source projects. 
      Developers and organizations use this index to:
      - Discover relevant open-source tools for their technology stack
      - Understand the open-source ecosystem in their domain
      - Make informed decisions about which projects to adopt or contribute to
      - Assess the health and importance of projects in specific technology areas

      Accurate categorization is essential for users to find the right projects when browsing by technology domain or industry vertical.

      ## Project Information
      - URL: ${repo_url}
      - Description: ${repo_description}
      - Topics: ${repo_topics}
      - Homepage: ${repo_homepage}

      ## Available Categories
      These categories are organized by category groups:

      ${category_structure_text}

      ## Your Task
      Analyze the project and determine which categories it belongs to. A project can belong to multiple categories if appropriate.

      Consider:
      - The project's primary functionality and purpose
      - The technology domain it operates in
      - The industry or vertical it serves (if applicable)
      - How developers would expect to find this project when browsing by category

      If the project doesn't clearly fit into any of the available categories, return an empty list for categories.

      Return a JSON with the following format:
      {{
          "categories": ["Category1", "Category2", ...],
          "explanation": "Brief explanation of why you chose these categories"
      }}

      Only include categories from the provided list. Do not create new categories.
`

    const llmService = new LlmService(
      qx,
      {
        accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
      },
      getServiceLogger(),
    )

    const { result } = await llmService.findRepoCategories<{
      description: string
      index: number
    }>(prompt)

    console.log('LLM result:', result)

    return ['']
  }
}
