import { Transaction } from 'sequelize'

import { Error400, validateNonLfSlug } from '@crowd/common'
import { QueryExecutor } from '@crowd/data-access-layer'
import { ICreateInsightsProject, findBySlug } from '@crowd/data-access-layer/src/collections'
import {
  buildSegmentActivityTypes,
  isSegmentSubproject,
} from '@crowd/data-access-layer/src/segments'
import { LoggerBase } from '@crowd/logging'
import {
  ActivityTypeSettings,
  PlatformType,
  SegmentActivityTypesCreateData,
  SegmentCriteria,
  SegmentData,
  SegmentLevel,
  SegmentUpdateData,
} from '@crowd/types'

import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'
import MemberRepository from '../database/repositories/memberRepository'
import SegmentRepository from '../database/repositories/segmentRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'
import { CollectionService } from './collectionService'

interface UnnestedActivityTypes {
  [key: string]: any
}
export default class SegmentService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async update(id: string, data: SegmentUpdateData): Promise<SegmentData> {
    const segment = await this.findById(id)

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const segmentRepository = new SegmentRepository({ ...this.options, transaction })

      // make sure non-lf projects' slug are namespaced appropriately
      if (data.isLF === false) data.slug = validateNonLfSlug(data.slug)
      // do the update
      await segmentRepository.update(id, data)
      // update relation fields of parent objects
      if (!isSegmentSubproject(segment) && (data.name || data.slug)) {
        await segmentRepository.updateChildrenBulk(segment, {
          name: data.name,
          slug: data.slug,
          isLF: data.isLF,
        })
      }

      await SequelizeRepository.commitTransaction(transaction)

      return await this.findById(id)
    } catch (error) {
      if (error?.message.includes("must match its parent's isLF value")) {
        // No rollback needed here, check_segment_isLF_consistency() failed at commit due to a deferred constraint.
        throw new Error400(this.options.language, `settings.segments.errors.isLfNotMatchingParent`)
      }
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async createProjectGroup(data: SegmentData): Promise<SegmentData> {
    // project groups shouldn't have parentSlug or grandparentSlug
    if (data.parentSlug || data.grandparentSlug) {
      throw new Error(`Project groups can't have parent or grandparent segments.`)
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)
    const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction })

    const collectionService = new CollectionService({ ...this.options, transaction })
    const segmentRepository = new SegmentRepository({ ...this.options, transaction })

    // Check for existing project group with same slug
    const existingBySlug = await segmentRepository.findBySlug(data.slug, SegmentLevel.PROJECT_GROUP)
    if (existingBySlug) {
      throw new Error400(
        this.options.language,
        'settings.segments.errors.projectGroupSlugExists',
        data.slug,
      )
    }

    // Check for existing project group with same name
    const existingByName = await segmentRepository.findByName(data.name, SegmentLevel.PROJECT_GROUP)
    if (existingByName) {
      throw new Error400(
        this.options.language,
        'settings.segments.errors.projectGroupNameExists',
        data.name,
      )
    }

    try {
      // create project group
      const projectGroup = await segmentRepository.create(data)

      await collectionService.createCollection({
        name: data.name,
        categoryId: null,
        description: '',
        slug: data.slug,
        starred: data.isLF ?? false,
      })

      // create project counterpart
      const project = await segmentRepository.create({
        ...data,
        parentSlug: data.slug,
        parentName: data.name,
        parentId: projectGroup.id,
      })

      // create subproject counterpart
      await this.createSubprojectInternal(
        {
          ...data,
          parentSlug: data.slug,
          grandparentSlug: data.slug,
          parentName: data.name,
          grandparentName: data.name,
          parentId: project.id,
          grandparentId: projectGroup.id,
        },
        qx,
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      return await this.findById(projectGroup.id)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async createProject(data: SegmentData): Promise<SegmentData> {
    // project groups shouldn't have parentSlug or grandparentSlug
    if (data.grandparentSlug) {
      throw new Error(`Projects can't have grandparent segments.`)
    }

    if (!data.parentSlug) {
      throw new Error('Missing parentSlug. Projects must belong to a project group.')
    }
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction })

    const segmentRepository = new SegmentRepository({ ...this.options, transaction })

    const parent = await segmentRepository.findBySlug(data.parentSlug, SegmentLevel.PROJECT_GROUP)

    if (parent === null) {
      throw new Error(`Project group ${data.parentName} does not exist.`)
    }

    // Check for existing project with same slug in the project group
    const existingBySlug = await segmentRepository.findBySlug(data.slug, SegmentLevel.PROJECT)
    if (existingBySlug && existingBySlug.parentSlug === data.parentSlug) {
      throw new Error400(
        this.options.language,
        'settings.segments.errors.projectSlugExists',
        data.slug,
        parent.name,
      )
    }

    // Check for existing project with same name in the project group
    const existingByName = await segmentRepository.findByName(data.name, SegmentLevel.PROJECT)
    if (existingByName && existingByName.parentSlug === data.parentSlug) {
      throw new Error400(
        this.options.language,
        'settings.segments.errors.projectNameExists',
        data.name,
        parent.name,
      )
    }

    if (parent.isLF !== data.isLF)
      throw new Error400(this.options.language, `settings.segments.errors.isLfNotMatchingParent`)
    if (data.isLF === false) data.slug = validateNonLfSlug(data.slug)

    try {
      // create project
      const project = await segmentRepository.create({ ...data, parentId: parent.id })

      // create subproject counterpart
      await this.createSubprojectInternal(
        {
          ...data,
          parentSlug: data.slug,
          grandparentSlug: data.parentSlug,
          name: data.name,
          parentName: data.name,
          grandparentName: parent.name,
          parentId: project.id,
          grandparentId: parent.id,
        },
        qx,
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      return await this.findById(project.id)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async createSubproject(data: SegmentData): Promise<SegmentData> {
    return SequelizeRepository.withTx(this.options, async (tx) => {
      const qx = SequelizeRepository.getQueryExecutor({ ...this.options, transaction: tx })
      return this.createSubprojectInternal(data, qx, tx)
    })
  }

  async createSubprojectInternal(
    data: SegmentData,
    qx: QueryExecutor,
    transaction: Transaction,
  ): Promise<SegmentData> {
    if (!data.parentSlug) {
      throw new Error('Missing parentSlug. Subprojects must belong to a project.')
    }

    if (!data.grandparentSlug) {
      throw new Error('Missing grandparentSlug. Subprojects must belong to a project group.')
    }

    const segmentRepository = new SegmentRepository({ ...this.options, transaction })
    const collectionService = new CollectionService({ ...this.options, transaction })

    const parent = await segmentRepository.findBySlug(data.parentSlug, SegmentLevel.PROJECT)
    if (!parent) {
      throw new Error(`Project ${data.parentSlug} does not exist.`)
    }

    if (parent.isLF === false) {
      data.slug = validateNonLfSlug(data.slug)
    }

    // Check for existing subproject with same slug in the project
    const existingBySlug = await segmentRepository.findBySlug(data.slug, SegmentLevel.SUB_PROJECT)
    if (existingBySlug && existingBySlug.parentSlug === data.parentSlug) {
      throw new Error400(
        this.options.language,
        'settings.segments.errors.subprojectSlugExists',
        data.slug,
        parent.name,
      )
    }

    // Check for existing subproject with same name in the project
    const existingByName = await segmentRepository.findByName(data.name, SegmentLevel.SUB_PROJECT)
    if (existingByName && existingByName.parentSlug === data.parentSlug) {
      throw new Error400(
        this.options.language,
        'settings.segments.errors.subprojectNameExists',
        data.name,
        parent.name,
      )
    }

    const grandparent = await segmentRepository.findBySlug(
      data.grandparentSlug,
      SegmentLevel.PROJECT_GROUP,
    )
    if (!grandparent) {
      throw new Error(`Project group ${data.grandparentSlug} does not exist.`)
    }

    const subproject = await segmentRepository.create({
      ...data,
      parentId: parent.id,
      grandparentId: grandparent.id,
      isLF: parent.isLF,
    })

    const collections = await findBySlug(qx, data.grandparentSlug)

    const [existingProject] = await collectionService.findInsightsProjectsBySlug(subproject.slug)

    const normalizedSlug = subproject.slug.replace(/^nonlf_/, '')

    const projectData: Partial<ICreateInsightsProject> = {
      segmentId: subproject.id,
      name: subproject.name,
      slug: normalizedSlug,
      ...(parent.isLF && { collections: collections.map((c) => c.id), starred: false }),
    }

    const mustUpdateProject = existingProject && !existingProject.segmentId

    if (mustUpdateProject) {
      await collectionService.updateInsightsProject(existingProject.id, projectData)
    } else {
      await collectionService.createInsightsProject(projectData)
    }

    return subproject
  }

  async findById(id) {
    return new SegmentRepository(this.options).findById(id)
  }

  async findByIds(ids: string[]) {
    return new SegmentRepository(this.options).findByIds(ids)
  }

  async queryProjectGroups(search: SegmentCriteria) {
    const result = await new SegmentRepository(this.options).queryProjectGroups(search)

    // if (result.rows.length) {
    //   const membersCountPerSegment = await MemberRepository.countMembersPerSegment(
    //     this.options,
    //     result.rows.map((s) => s.id),
    //   )
    //   this.setMembersCount(result.rows, SegmentLevel.PROJECT_GROUP, membersCountPerSegment)
    // }

    return result
  }

  async queryProjects(search: SegmentCriteria) {
    const result = await new SegmentRepository(this.options).queryProjects(search)
    return result
  }

  async querySubprojects(search: SegmentCriteria) {
    const result = await new SegmentRepository(this.options).querySubprojects(search)
    return result
  }

  async querySubprojectsLite(search: SegmentCriteria) {
    const result = await new SegmentRepository(this.options).querySubprojectsLite(search)
    return result
  }

  async createActivityType(
    data: SegmentActivityTypesCreateData,
    platform: string = PlatformType.OTHER,
  ): Promise<ActivityTypeSettings> {
    if (!data.type) {
      throw new Error400(
        this.options.language,
        'settings.activityTypes.errors.typeRequiredWhenCreating',
      )
    }

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(this.options)

    const typeKey = data.type.toLowerCase()
    const platformKey = platform.toLowerCase()

    const activityTypes = SegmentRepository.getActivityTypes(this.options)

    if (!activityTypes.custom[platformKey]) {
      activityTypes.custom[platformKey] = {}
    }

    // check key already exists
    if (activityTypes.custom && activityTypes.custom[platformKey][typeKey]) {
      return activityTypes
    }

    activityTypes.custom[platformKey][typeKey] = {
      display: {
        default: data.type,
        short: data.type,
        channel: '',
      },
      calculateSentiment: false,
    }

    const updated = await new SegmentRepository(this.options).update(segment.id, {
      customActivityTypes: activityTypes.custom,
    })

    return updated.activityTypes
  }

  /**
   * unnest activity types with platform for easy access/manipulation
   * custom : {
   *    platform: {
   *         type1: settings1,
   *         type2: settings2
   *    }
   * }
   *
   * is transformed into
   * {
   *    type1: {...settings1, platform},
   *    type2: {...settings2, platform}
   * }
   *
   */
  static unnestActivityTypes(activityTypes: ActivityTypeSettings): UnnestedActivityTypes {
    return Object.keys(activityTypes.custom)
      .filter((k) => activityTypes.custom[k])
      .reduce((acc, platform) => {
        const unnestWithPlatform = Object.keys(activityTypes.custom[platform]).reduce(
          (acc2, key) => {
            acc2[key] = { ...activityTypes.custom[platform][key], platform }
            return acc2
          },
          {},
        )

        acc = { ...acc, ...unnestWithPlatform }
        return acc
      }, {})
  }

  async updateActivityType(key: string, data) {
    if (!data.type) {
      throw new Error400(
        this.options.language,
        'settings.activityTypes.errors.typeRequiredWhenUpdating',
      )
    }

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(this.options)

    const activityTypes = SegmentRepository.getActivityTypes(this.options)

    const activityTypesUnnested = SegmentService.unnestActivityTypes(activityTypes)

    // if key doesn't exist, throw 400
    if (!activityTypesUnnested[key]) {
      throw new Error400(this.options.language, 'settings.activityTypes.errors.notFound', key)
    }

    activityTypes.custom[activityTypesUnnested[key].platform][key] = {
      display: {
        default: data.type,
        short: data.type,
        channel: '',
      },
      calculateSentiment: false,
    }

    const updated = await new SegmentRepository(this.options).update(segment.id, {
      customActivityTypes: activityTypes.custom,
    })

    return updated.activityTypes
  }

  async destroyActivityType(key: string): Promise<ActivityTypeSettings> {
    const activityTypes = SegmentRepository.getActivityTypes(this.options)

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(this.options)

    const activityTypesUnnested = SegmentService.unnestActivityTypes(activityTypes)

    if (activityTypesUnnested[key]) {
      delete activityTypes.custom[activityTypesUnnested[key].platform][key]
      const updated = await new SegmentRepository(this.options).update(segment.id, {
        customActivityTypes: activityTypes.custom,
      })
      return updated.activityTypes
    }

    return activityTypes
  }

  static listActivityTypes(options): ActivityTypeSettings {
    return SegmentRepository.getActivityTypes(options)
  }

  /**
   * update activity channels after checking for duplicates with platform key
   */
  async updateActivityChannels(data) {
    if (!data.channel) {
      throw new Error400(
        this.options.language,
        'settings.activityChannels.errors.typeRequiredWhenCreating',
      )
    }

    const segment = SequelizeRepository.getStrictlySingleActiveSegment(this.options)

    const segmentRepository = new SegmentRepository(this.options)
    await segmentRepository.addActivityChannel(segment.id, data.platform, data.channel)
  }

  async getSegmentSubprojects(segments: string[]) {
    const segmentRepository = new SegmentRepository(this.options)
    const subprojects = await segmentRepository.getSegmentSubprojects(segments)
    return subprojects
  }

  async getTenantSubprojects() {
    const segmentRepository = new SegmentRepository(this.options)

    const { rows } = await segmentRepository.querySubprojects({})
    return rows
  }

  static async getTenantActivityTypes(subprojects: any) {
    if (!subprojects) {
      return { custom: {}, default: {} }
    }
    return subprojects.reduce((acc: any, subproject) => {
      const activityTypes = buildSegmentActivityTypes(subproject)

      return {
        custom: {
          ...acc.custom,
          ...activityTypes.custom,
        },
        default: {
          ...acc.default,
          ...activityTypes.default,
        },
      }
    }, {})
  }

  static async getTenantActivityChannels(segments: string[], options: any) {
    const segmentRepository = new SegmentRepository(options)

    const activityChannels = await segmentRepository.fetchTenantActivityChannels(segments)
    return activityChannels
  }

  private collectSubprojectIds(segments, level: SegmentLevel) {
    if (level === SegmentLevel.PROJECT_GROUP) {
      return segments.map((s) => this.collectSubprojectIds(s.projects, SegmentLevel.PROJECT)).flat()
    }

    if (level === SegmentLevel.PROJECT) {
      return segments
        .map((s) => this.collectSubprojectIds(s.subprojects, SegmentLevel.SUB_PROJECT))
        .flat()
    }

    if (level === SegmentLevel.SUB_PROJECT) {
      return segments.map((s) => s.id)
    }

    throw new Error(`Unknown segment level: ${level}`)
  }

  private setMembersCount(segments, level: SegmentLevel, membersCountPerSegment): number {
    if (level === SegmentLevel.PROJECT_GROUP) {
      let total = 0
      for (const projectGroup of segments) {
        projectGroup.members = this.setMembersCount(
          projectGroup.projects,
          SegmentLevel.PROJECT,
          membersCountPerSegment,
        )
        total += projectGroup.members
      }
      return total
    }

    if (level === SegmentLevel.PROJECT) {
      let total = 0
      for (const project of segments) {
        project.members = this.setMembersCount(
          project.subprojects,
          SegmentLevel.SUB_PROJECT,
          membersCountPerSegment,
        )
        total += project.members
      }
      return total
    }

    if (level === SegmentLevel.SUB_PROJECT) {
      let total = 0
      for (const subproject of segments) {
        subproject.members = membersCountPerSegment[subproject.id] || 0
        total += subproject.members
      }
      return total
    }

    throw new Error(`Unknown segment level: ${level}`)
  }

  private async addMemberCounts(segments, level: SegmentLevel) {
    const subprojectIds = this.collectSubprojectIds(segments, level)
    if (!subprojectIds.length) {
      return
    }

    const membersCountPerSegment = await MemberRepository.countMembersPerSegment(
      this.options,
      subprojectIds,
    )
    this.setMembersCount(segments, level, membersCountPerSegment)
  }

  static async refreshSegments(options: IRepositoryOptions) {
    const repo = new SegmentRepository(options)
    for (let i = 0; i < options.currentSegments.length; i++) {
      options.currentSegments[i] = await repo.findById(options.currentSegments[i].id)
    }
  }
}
