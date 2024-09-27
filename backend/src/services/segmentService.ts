import {
  ActivityTypeSettings,
  PlatformType,
  SegmentActivityTypesCreateData,
  SegmentCriteria,
  SegmentData,
  SegmentLevel,
  SegmentUpdateData,
} from '@crowd/types'
import { Error400 } from '@crowd/common'
import { LoggerBase } from '@crowd/logging'
import {
  buildSegmentActivityTypes,
  isSegmentSubproject,
} from '@crowd/data-access-layer/src/segments'
import SegmentRepository from '../database/repositories/segmentRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'
import MemberRepository from '../database/repositories/memberRepository'

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

      // do the update
      await segmentRepository.update(id, data)

      // update relation fields of parent objects
      if (!isSegmentSubproject(segment) && (data.name || data.slug)) {
        await segmentRepository.updateChildrenBulk(segment, { name: data.name, slug: data.slug })
      }

      await SequelizeRepository.commitTransaction(transaction)

      return await this.findById(id)
    } catch (error) {
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

    try {
      const segmentRepository = new SegmentRepository({ ...this.options, transaction })

      // create project group
      const projectGroup = await segmentRepository.create(data)

      // create project counterpart
      const project = await segmentRepository.create({
        ...data,
        parentSlug: data.slug,
        parentName: data.name,
        parentId: projectGroup.id,
      })

      // create subproject counterpart
      await segmentRepository.create({
        ...data,
        parentSlug: data.slug,
        grandparentSlug: data.slug,
        parentName: data.name,
        grandparentName: data.name,
        parentId: project.id,
        grandparentId: projectGroup.id,
      })

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

    const segmentRepository = new SegmentRepository({ ...this.options, transaction })

    const parent = await segmentRepository.findBySlug(data.parentSlug, SegmentLevel.PROJECT_GROUP)

    if (parent === null) {
      throw new Error(`Project group ${data.parentName} does not exist.`)
    }

    try {
      // create project
      const project = await segmentRepository.create({ ...data, parentId: parent.id })

      // create subproject counterpart
      await segmentRepository.create({
        ...data,
        parentSlug: data.slug,
        grandparentSlug: data.parentSlug,
        name: data.name,
        parentName: data.name,
        grandparentName: parent.name,
        parentId: project.id,
        grandparentId: parent.id,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return await this.findById(project.id)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async createSubproject(data: SegmentData): Promise<SegmentData> {
    if (!data.parentSlug) {
      throw new Error('Missing parentSlug. Subprojects must belong to a project.')
    }

    if (!data.grandparentSlug) {
      throw new Error('Missing grandparentSlug. Subprojects must belong to a project group.')
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const segmentRepository = new SegmentRepository({
        ...this.options,
        transaction,
      })

      const parent = await segmentRepository.findBySlug(data.parentSlug, SegmentLevel.PROJECT)

      if (parent === null) {
        throw new Error(`Project ${data.parentSlug} does not exist.`)
      }

      const grandparent = await segmentRepository.findBySlug(
        data.grandparentSlug,
        SegmentLevel.PROJECT_GROUP,
      )

      if (grandparent === null) {
        throw new Error(`Project group ${data.parentSlug} does not exist.`)
      }

      const subproject = await segmentRepository.create({
        ...data,
        parentId: parent.id,
        grandparentId: grandparent.id,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return subproject
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
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
      isContribution: false,
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
      isContribution: false,
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
