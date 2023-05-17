import lodash from 'lodash'
import { v4 as uuid } from 'uuid'
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'
import {
  SegmentCreateData,
  SegmentCriteria,
  SegmentData,
  SegmentLevel,
  SegmentProjectGroupNestedData,
  SegmentProjectNestedData,
  SegmentRawData,
  SegmentStatus,
  SegmentUpdateChildrenPartialData,
  SegmentUpdateData,
} from '../../types/segmentTypes'
import { PageData } from '../../types/common'
import Error404 from '../../errors/Error404'
import { ActivityTypeSettings, DEFAULT_ACTIVITY_TYPE_SETTINGS } from '../../types/activityTypes'
import SequelizeTestUtils from '../utils/sequelizeTestUtils'

class SegmentRepository extends RepositoryBase<
  SegmentData,
  string,
  SegmentCreateData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  /**
   * Insert a segment.
   * @param data segment data
   * @returns
   */
  async create(data: SegmentCreateData): Promise<SegmentData> {
    const transaction = this.transaction

    const segmentInsertResult = await this.options.database.sequelize.query(
      `INSERT INTO "segments" ("id", "name", "slug", "parentSlug", "grandparentSlug", "status", "parentName", "sourceId", "sourceParentId", "tenantId", "grandparentName")
          VALUES
              (:id, :name, :slug, :parentSlug, :grandparentSlug, :status, :parentName, :sourceId, :sourceParentId, :tenantId, :grandparentName)
          RETURNING "id"
        `,
      {
        replacements: {
          id: uuid(),
          name: data.name,
          parentName: data.parentName || null,
          grandparentName: data.grandparentName || null,
          slug: data.slug,
          parentSlug: data.parentSlug || null,
          grandparentSlug: data.grandparentSlug || null,
          status: data.status || SegmentStatus.ACTIVE,
          sourceId: data.sourceId || null,
          sourceParentId: data.sourceParentId || null,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )

    const segment = await this.findById(segmentInsertResult[0][0].id)
    return segment
  }

  /**
   * Updates:
   * parent slugs of children => parentSlug, grandparentSlug
   * parent names of children => parentName, grandparentName
   * @param id
   * @param slug
   * @param name
   */
  async updateChildrenBulk(
    id: string,
    data: SegmentUpdateChildrenPartialData,
  ): Promise<SegmentData> {
    const segment = await this.findById(id)

    if (SegmentRepository.isProjectGroup(segment)) {
      // update projects
      await this.updateBulk(
        (segment as SegmentProjectGroupNestedData).projects.map((p) => p.id),
        {
          parentName: data.name,
          parentSlug: data.slug,
        },
      )

      const subprojectIds = (segment as SegmentProjectGroupNestedData).projects.reduce((acc, p) => {
        acc.push(...(p as SegmentProjectNestedData).subprojects.map((sp) => sp.id))
        return acc
      }, [])

      await this.updateBulk(subprojectIds, {
        grandparentSlug: data.slug,
        grandparentName: data.name,
      })
    } else if (SegmentRepository.isProject(segment)) {
      // update subprojects
      await this.updateBulk(
        (segment as SegmentProjectNestedData).subprojects.map((sp) => sp.id),
        {
          parentName: data.name,
          parentSlug: data.slug,
        },
      )
    }

    return this.findById(id)
  }

  async updateBulk(ids: string[], data: SegmentUpdateData): Promise<string[]> {
    const transaction = this.transaction

    // strip arbitrary fields
    const updateFields = Object.keys(data).filter(
      (key) =>
        data[key] &&
        [
          'name',
          'slug',
          'parentSlug',
          'grandparentSlug',
          'status',
          'parentName',
          'sourceId',
          'sourceParentId',
          'grandparentName',
        ].includes(key),
    )

    let segmentUpdateQuery = `UPDATE segments SET `
    const replacements = {} as any

    for (const field of updateFields) {
      segmentUpdateQuery += ` "${field}" = :${field} `
      replacements[field] = data[field]

      if (updateFields[updateFields.length - 1] !== field) {
        segmentUpdateQuery += ', '
      }
    }

    segmentUpdateQuery += ` WHERE id in (:ids) and "tenantId" = :tenantId returning id`
    replacements.tenantId = this.options.currentTenant.id
    replacements.ids = ids

    const idsUpdated = await this.options.database.sequelize.query(segmentUpdateQuery, {
      replacements,
      type: QueryTypes.UPDATE,
      transaction,
    })

    return idsUpdated
  }

  override async update(id: string, data: SegmentUpdateData): Promise<SegmentData> {
    const transaction = this.transaction

    const segment = await this.findById(id)

    if (!segment) {
      throw new Error404()
    }

    // strip arbitrary fields
    const updateFields = Object.keys(data).filter((key) =>
      [
        'name',
        'slug',
        'parentSlug',
        'grandparentSlug',
        'status',
        'parentName',
        'sourceId',
        'sourceParentId',
        'customActivityTypes',
        'activityChannels',
      ].includes(key),
    )

    let segmentUpdateQuery = `UPDATE segments SET `
    const replacements = {} as any

    for (const field of updateFields) {
      segmentUpdateQuery += ` "${field}" = :${field} `
      replacements[field] = data[field]

      if (updateFields[updateFields.length - 1] !== field) {
        segmentUpdateQuery += ', '
      }
    }

    segmentUpdateQuery += ` WHERE id = :id and "tenantId" = :tenantId `
    replacements.tenantId = this.options.currentTenant.id
    replacements.id = id

    if (replacements.customActivityTypes) {
      replacements.customActivityTypes = JSON.stringify(replacements.customActivityTypes)
    }

    await this.options.database.sequelize.query(segmentUpdateQuery, {
      replacements,
      type: QueryTypes.UPDATE,
      transaction,
    })

    return this.findById(id)
  }

  async getChildrenOfProjectGroups(slug: string) {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `
                select * from segments s
                where (s."grandparentSlug" = :slug or s."parentSlug" = :slug) and
                s."tenantId" = :tenantId;
            `,
      {
        replacements: {
          slug,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records
  }

  async getChildrenOfProjects(slug: string) {
    const records = await this.options.database.sequelize.query(
      `
                select * from segments s
                where s."parentSlug" = :slug
                and s."tenantId" = :tenantId;
            `,
      {
        replacements: {
          slug,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
      },
    )

    return records
  }

  async findBySlug(slug: string, level: SegmentLevel) {
    const transaction = this.transaction
    const replacements = {} as SegmentData

    let findBySlugQuery = `SELECT * FROM segments WHERE slug = :slug `
    replacements.slug = slug

    if (level === SegmentLevel.SUB_PROJECT) {
      findBySlugQuery += ` and "parentSlug" is not null and "grandparentSlug" is not null`
    } else if (level === SegmentLevel.PROJECT) {
      findBySlugQuery += ` and "parentSlug" is not null and "grandparentSlug" is null`
    } else if (level === SegmentLevel.PROJECT_GROUP) {
      findBySlugQuery += ` and "parentSlug" is null and "grandparentSlug" is null`
    }

    const records = await this.options.database.sequelize.query(findBySlugQuery, {
      replacements,
      type: QueryTypes.SELECT,
      transaction,
    })

    if (records.length === 0) {
      return null
    }

    return this.findById(records[0].id)
  }

  async findInIds(ids: string[]): Promise<SegmentData[]> {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM segments
             WHERE id in (:ids)
             and "tenantId" = :tenantId;
            `,
      {
        replacements: {
          ids,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records.map((sr) => SegmentRepository.populateRelations(sr))
  }

  static populateRelations(record: SegmentRawData): SegmentData {
    const segmentData: SegmentData = {
      ...record,
      activityTypes: null,
    }

    if (SegmentRepository.isSubproject(record)) {
      segmentData.activityTypes = SegmentRepository.buildActivityTypes(record)
    }

    return segmentData
  }

  async findById(id: string): Promise<SegmentProjectGroupNestedData | SegmentProjectNestedData> {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM segments
             WHERE id = :id
             and "tenantId" = :tenantId;
            `,
      {
        replacements: {
          id,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (records.length === 0) {
      return null
    }

    const record = records[0]

    if (SegmentRepository.isProjectGroup(record)) {
      // find projects
      // TODO: Check sorting - parent should come first
      const children = await this.getChildrenOfProjectGroups(record.slug)

      const projects = children.reduce((acc, child) => {
        if (SegmentRepository.isProject(child)) {
          acc.push(child)
        } else if (SegmentRepository.isSubproject(child)) {
          // find project index
          const projectIndex = acc.findIndex((project) => project.slug === child.parentSlug)
          if (!acc[projectIndex].subprojects) {
            acc[projectIndex].subprojects = [child]
          } else {
            acc[projectIndex].subprojects.push(child)
          }
        }
        return acc
      }, [])

      record.projects = projects
    } else if (SegmentRepository.isProject(record)) {
      const children = await this.getChildrenOfProjects(record.slug)
      record.subprojects = children
    }

    return SegmentRepository.populateRelations(records[0])
  }

  static isProjectGroup(segment: SegmentData | SegmentRawData): boolean {
    return segment.slug && segment.parentSlug === null && segment.grandparentSlug === null
  }

  static isProject(segment: SegmentData | SegmentRawData): boolean {
    return segment.slug && segment.parentSlug && segment.grandparentSlug === null
  }

  static isSubproject(segment: SegmentData | SegmentRawData): boolean {
    return segment.slug != null && segment.parentSlug != null && segment.grandparentSlug != null
  }

  /**
   * Query project groups with their children
   * @returns
   */
  async queryProjectGroups(criteria: SegmentCriteria): Promise<PageData<SegmentData[]>> {
    let searchQuery = 'WHERE 1=1'

    if (criteria.status) {
      searchQuery += `AND s.status = :status`
    }

    if (criteria.name) {
      searchQuery += `AND s.name like ':name%'`
    }

    const projectGroups = await this.options.database.sequelize.query(
      `
            WITH foundations as (SELECT 
                            f.id as foundation_id,
                            f.name as foundation_name,
                            f.status,
                            f."createdAt",
                            f."updatedAt",
                            f."sourceId",
                            f."sourceParentId",
                            f.slug,
                            p.name as project_name,
                            p.id as project_id,
                            COUNT(DISTINCT sp.id) AS subproject_count,
                            jsonb_agg(jsonb_build_object('id', sp.id ,'name', sp.name)) as subprojects
                     FROM segments f
                              JOIN segments p ON p."parentSlug" = f."slug" AND p."grandparentSlug" IS NULL
                              JOIN segments sp ON sp."parentSlug" = p."slug" and sp."grandparentSlug" is not null
                     WHERE f."parentSlug" IS NULL
                     GROUP BY f."id", p.id)
            SELECT s.*,
                   count(*) over () as "totalCount",  
                   jsonb_agg(jsonb_build_object('id', f.project_id ,
                                                'name', f.project_name, 
                                                'subprojects', f.subprojects)
                                                ) as projects
            FROM segments s
                    join foundations f on s.id = f.foundation_id
            ${searchQuery}
            GROUP BY s.id, f.foundation_name
            ${this.getPaginationString(criteria)};
            `,
      {
        replacements: {
          name: criteria.name,
          status: criteria.status,
        },
        type: QueryTypes.SELECT,
      },
    )

    const count = projectGroups.length > 0 ? projectGroups[0].totalCount : 0

    const rows = projectGroups.map((i) => SequelizeTestUtils.objectWithoutKey(i, 'totalCount'))

    // TODO: Add member count to segments after implementing member relations
    return { count, rows, limit: criteria.limit, offset: criteria.offset }
  }

  async queryProjects(criteria: SegmentCriteria): Promise<PageData<SegmentData[]>> {
    let searchQuery = ''

    if (criteria.status) {
      searchQuery += ` AND s.status = :status`
    }

    if (criteria.name) {
      searchQuery += ` AND s.name like ':name%'`
    }

    const projects = await this.options.database.sequelize.query(
      `
            SELECT 
                s.*,
                COUNT(DISTINCT sp.id)                                       AS subproject_count,
                jsonb_agg(jsonb_build_object('id', sp.id, 'name', sp.name)) as subprojects,
                count(*) over () as "totalCount"
            FROM segments s
                JOIN segments sp ON sp."parentSlug" = s."slug" and sp."grandparentSlug" is not null
            WHERE 
                s."grandparentSlug" IS NULL
            and s."parentSlug" is not null
            ${searchQuery}
            GROUP BY s."id"
            ${this.getPaginationString(criteria)};
            `,
      {
        replacements: {
          name: criteria.name,
          status: criteria.status,
        },
        type: QueryTypes.SELECT,
      },
    )

    const count = projects.length > 0 ? projects[0].totalCount : 0

    const rows = projects.map((i) => SequelizeTestUtils.objectWithoutKey(i, 'totalCount'))

    // TODO: Add member count to segments after implementing member relations
    // TODO: Add segment settings to payload
    return { count, rows, limit: criteria.limit, offset: criteria.offset }
  }

  async querySubprojects(criteria: SegmentCriteria): Promise<PageData<SegmentData[]>> {
    let searchQuery = ''

    if (criteria.status) {
      searchQuery += ` AND s.status = :status`
    }

    if (criteria.name) {
      searchQuery += ` AND s.name like ':name%'`
    }

    const subprojects = await this.options.database.sequelize.query(
      `
            select s.*,
            count(*) over () as "totalCount"
            from segments s
            where s."grandparentSlug" is not null
            and s."parentSlug" is not null
            and s."tenantId" = :tenantId
            ${searchQuery}
            GROUP BY s."id"
            ${this.getPaginationString(criteria)};
            `,
      {
        replacements: {
          tenantId: this.currentTenant.id,
          name: criteria.name,
          status: criteria.status,
        },
        type: QueryTypes.SELECT,
      },
    )

    const count = subprojects.length > 0 ? subprojects[0].totalCount : 0

    const rows = subprojects.map((i) => {
      const subproject = SequelizeTestUtils.objectWithoutKey(i, 'totalCount')
      return SegmentRepository.populateRelations(subproject)
    })

    // TODO: Add member count to segments after implementing member relations
    return { count, rows, limit: criteria.limit, offset: criteria.offset }
  }

  /**
   * Builds activity types object with both default and custom activity types
   * @param record
   * @returns
   */
  static buildActivityTypes(record: SegmentRawData): ActivityTypeSettings {
    const activityTypes = {} as ActivityTypeSettings

    activityTypes.default = lodash.cloneDeep(DEFAULT_ACTIVITY_TYPE_SETTINGS)
    activityTypes.custom = {}

    if (Object.keys(record.customActivityTypes).length > 0) {
      activityTypes.custom = record.customActivityTypes
    }

    return activityTypes
  }

  static getActivityTypes(options: IRepositoryOptions): ActivityTypeSettings {
    // return options.currentTenant?.settings[0]?.dataValues.activityTypes
    return options.currentSegments.reduce((acc, s) => lodash.merge(acc, s.activityTypes), {})
  }

  static getActivityChannels(options: IRepositoryOptions) {
    return options.currentSegments.reduce((acc, s) => lodash.merge(acc, s.activityChannels), {})
  }

  static activityTypeExists(platform: string, key: string, options: IRepositoryOptions): boolean {
    const activityTypes = this.getActivityTypes(options)

    if (
      (activityTypes.default[platform] && activityTypes.default[platform][key]) ||
      (activityTypes.custom[platform] && activityTypes.custom[platform][key])
    ) {
      return true
    }

    return false
  }
}

export default SegmentRepository
