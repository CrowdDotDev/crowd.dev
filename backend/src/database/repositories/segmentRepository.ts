import lodash from 'lodash'
import { v4 as uuid } from 'uuid'
import { QueryTypes } from 'sequelize'
import { DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import {
  ActivityTypeSettings,
  SegmentCreateData,
  SegmentData,
  SegmentLevel,
  SegmentProjectGroupNestedData,
  SegmentProjectNestedData,
  SegmentRawData,
  SegmentStatus,
  SegmentUpdateChildrenPartialData,
  SegmentUpdateData,
  PageData,
  QueryData,
} from '@crowd/types'
import { Error404 } from '@crowd/common'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'
import removeFieldsFromObject from '../../utils/getObjectWithoutKey'
import IntegrationRepository from './integrationRepository'
import SequelizeRepository from './sequelizeRepository'

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
      `INSERT INTO "segments" ("id", "url", "name", "slug", "parentSlug", "grandparentSlug", "status", "parentName", "sourceId", "sourceParentId", "tenantId", "grandparentName")
          VALUES
              (:id, :url, :name, :slug, :parentSlug, :grandparentSlug, :status, :parentName, :sourceId, :sourceParentId, :tenantId, :grandparentName)
          RETURNING "id"
        `,
      {
        replacements: {
          id: uuid(),
          url: data.url || null,
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
    segment: SegmentData,
    data: SegmentUpdateChildrenPartialData,
  ): Promise<SegmentData> {
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

    return this.findById(segment.id)
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
        'url',
        'slug',
        'parentSlug',
        'grandparentSlug',
        'status',
        'parentName',
        'sourceId',
        'sourceParentId',
        'customActivityTypes',
      ].includes(key),
    )

    if (updateFields.length > 0) {
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
    }

    return this.findById(id)
  }

  async addActivityChannel(segmentId: string, platform: string, channel: string) {
    const transaction = this.transaction

    await this.options.database.sequelize.query(
      `
        INSERT INTO "segmentActivityChannels" ("tenantId", "segmentId", "platform", "channel")
        VALUES (:tenantId, :segmentId, :platform, :channel)
        ON CONFLICT DO NOTHING;
      `,
      {
        replacements: {
          tenantId: this.options.currentTenant.id,
          segmentId,
          platform,
          channel,
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )
  }

  async fetchActivityChannels(segmentId: string) {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `
        SELECT
          "platform",
          json_agg(DISTINCT "channel") AS "channels"
        FROM "segmentActivityChannels"
        WHERE "tenantId" = :tenantId
          AND "segmentId" = :segmentId
        GROUP BY "platform";
      `,
      {
        replacements: {
          tenantId: this.options.currentTenant.id,
          segmentId,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records.reduce((acc, r) => {
      acc[r.platform] = r.channels
      return acc
    }, {})
  }

  async getSegmentSubprojects(segments: string[]) {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `
      with input_segment AS (
        select
          id,
          slug,
          "parentSlug",
          "grandparentSlug"
        from segments
        where id in (:segmentIds)
          and "tenantId" = :tenantId
      ),
      segment_level AS (
        select
          case
            when "parentSlug" is not null and "grandparentSlug" is not null
                then 'child'
            when "parentSlug" is not null and "grandparentSlug" is null
                then 'parent'
            when "parentSlug" is null and "grandparentSlug" is null
                then 'grandparent'
            end as level,
          id,
          slug,
          "parentSlug",
          "grandparentSlug"
        from input_segment
      )
        select s.*
        from segments s
        join segment_level sl on (sl.level = 'child' and s.id = sl.id)
            or (sl.level = 'parent' and s."parentSlug" = sl.slug and s."grandparentSlug" is not null)
            or (sl.level = 'grandparent' and s."grandparentSlug" = sl.slug)
        where status = 'active';
      `,
      {
        replacements: {
          tenantId: this.options.currentTenant.id,
          segmentIds: segments,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records
  }

  async fetchTenantActivityChannels(segmentIds: string[]) {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `
        SELECT
          "platform",
          json_agg(DISTINCT "channel") AS "channels"
        FROM "segmentActivityChannels"
        WHERE "tenantId" = :tenantId
        and "segmentId" in (:segmentIds)
        GROUP BY "platform";
      `,
      {
        replacements: {
          tenantId: this.options.currentTenant.id,
          segmentIds,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records.reduce((acc, r) => {
      acc[r.platform] = r.channels
      return acc
    }, {})
  }

  async getChildrenOfProjectGroups(segment: SegmentData) {
    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `
          SELECT *
          FROM segments s
          WHERE (s."grandparentSlug" = :slug OR
                 (s."parentSlug" = :slug AND s."grandparentSlug" IS NULL))
            AND s."tenantId" = :tenantId
          ORDER BY "grandparentSlug" DESC, "parentSlug" DESC, slug DESC;
      `,
      {
        replacements: {
          slug: segment.slug,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records
  }

  async getChildrenOfProjects(segment: SegmentData) {
    const records = await this.options.database.sequelize.query(
      `
                select * from segments s
                where s."parentSlug" = :slug
                  AND s."grandparentSlug" = :parentSlug
                and s."tenantId" = :tenantId;
            `,
      {
        replacements: {
          slug: segment.slug,
          parentSlug: segment.parentSlug,
          tenantId: this.options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
      },
    )

    return records
  }

  async findBySlug(slug: string, level: SegmentLevel) {
    const transaction = this.transaction

    let findBySlugQuery = `SELECT * FROM segments WHERE slug = :slug AND "tenantId" = :tenantId`

    if (level === SegmentLevel.SUB_PROJECT) {
      findBySlugQuery += ` and "parentSlug" is not null and "grandparentSlug" is not null`
    } else if (level === SegmentLevel.PROJECT) {
      findBySlugQuery += ` and "parentSlug" is not null and "grandparentSlug" is null`
    } else if (level === SegmentLevel.PROJECT_GROUP) {
      findBySlugQuery += ` and "parentSlug" is null and "grandparentSlug" is null`
    }

    const records = await this.options.database.sequelize.query(findBySlugQuery, {
      replacements: {
        slug,
        tenantId: this.options.currentTenant.id,
      },
      type: QueryTypes.SELECT,
      transaction,
    })

    if (records.length === 0) {
      return null
    }

    return this.findById(records[0].id)
  }

  async findInIds(ids: string[]): Promise<SegmentData[]> {
    if (ids.length === 0) {
      return []
    }

    const transaction = this.transaction

    const records = await this.options.database.sequelize.query(
      `
        SELECT
          s.*
        FROM segments s
        WHERE id in (:ids)
        AND s."tenantId" = :tenantId
        GROUP BY s.id;
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
      `
        SELECT
          s.*
        FROM segments s
        WHERE s.id = :id
        AND s."tenantId" = :tenantId
        GROUP BY s.id;
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
      const children = await this.getChildrenOfProjectGroups(record)

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
      const children = await this.getChildrenOfProjects(record)
      record.subprojects = children
    }

    return SegmentRepository.populateRelations(record)
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
  async queryProjectGroups(criteria: QueryData): Promise<PageData<SegmentData>> {
    let searchQuery = 'WHERE 1=1'
    let segmentsSearchQuery = ''

    const replacements = {
      tenantId: this.currentTenant.id,
      name: `%${criteria.filter?.name}%`,
      status: criteria.filter?.status,
      adminSegments: null,
    }

    if (criteria.filter?.status) {
      searchQuery += `AND s.status = :status`
    }

    if (criteria.filter?.name) {
      searchQuery += `AND s.name ilike :name`
    }

    if (criteria.filter?.adminOnly) {
      const adminSegments = this.options.currentUser.tenants.flatMap((t) => t.adminSegments)
      if (adminSegments.length === 0) {
        return { count: 0, rows: [], limit: criteria.limit, offset: criteria.offset }
      }
      segmentsSearchQuery += `AND sp.id IN (:adminSegments)`
      replacements.adminSegments = adminSegments
    }

    const projectGroups = await this.options.database.sequelize.query(
      `
          WITH
              foundations AS (
                  SELECT
                      f.id AS foundation_id,
                      f.name AS foundation_name,
                      f.status,
                      f."createdAt",
                      f."updatedAt",
                      f."sourceId",
                      f."sourceParentId",
                      f.slug,
                      p.name AS project_name,
                      p.id AS project_id,
                      p.status AS project_status,
                      p.slug AS project_slug,
                      COUNT(DISTINCT sp.id) AS subproject_count,
                      JSONB_AGG(JSONB_BUILD_OBJECT(
                          'id', sp.id,
                          'name', sp.name,
                          'status', sp.status,
                          'slug', sp.slug
                          )) AS subprojects
                  FROM segments f
                  JOIN segments p
                      ON p."parentSlug" = f."slug"
                             AND p."grandparentSlug" IS NULL
                             AND p."tenantId" = f."tenantId"
                  JOIN segments sp
                      ON sp."parentSlug" = p."slug"
                             AND sp."grandparentSlug" = f.slug
                             AND sp."tenantId" = f."tenantId"
                  WHERE f."parentSlug" IS NULL
                    AND f."tenantId" = :tenantId
                    ${segmentsSearchQuery}
                  GROUP BY f."id", p.id
              )
          SELECT
              s.*,
              COUNT(*) OVER () AS "totalCount",
              JSONB_AGG(JSONB_BUILD_OBJECT(
                      'id', f.project_id,
                      'name', f.project_name,
                      'status', f.project_status,
                      'slug', f.project_slug,
                      'subprojects', f.subprojects
                  )) AS projects
          FROM segments s
          JOIN foundations f ON s.id = f.foundation_id
          ${searchQuery}
          GROUP BY s.id, f.foundation_name
          ORDER BY f.foundation_name
          ${this.getPaginationString(criteria)};
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    )

    const count = projectGroups.length > 0 ? Number.parseInt(projectGroups[0].totalCount, 10) : 0

    const rows = projectGroups.map((i) => removeFieldsFromObject(i, 'totalCount'))

    return { count, rows, limit: criteria.limit, offset: criteria.offset }
  }

  async queryProjects(criteria: QueryData): Promise<PageData<SegmentData>> {
    let searchQuery = ''

    if (criteria.filter?.status) {
      searchQuery += ` AND s.status = :status`
    }

    if (criteria.filter?.name) {
      searchQuery += ` AND s.name ilike :name`
    }

    if (criteria.filter?.parentSlug) {
      searchQuery += ` AND s."parentSlug" = :parent_slug `
    }

    const projects = await this.options.database.sequelize.query(
      `
            SELECT 
                s.*,
                COUNT(DISTINCT sp.id)                                       AS subproject_count,
                jsonb_agg(jsonb_build_object('id', sp.id, 'name', sp.name, 'status', sp.status)) as subprojects,
                count(*) over () as "totalCount"
            FROM segments s
                JOIN segments sp ON sp."parentSlug" = s."slug" and sp."grandparentSlug" is not null
                AND sp."tenantId" = s."tenantId"
            WHERE 
                s."grandparentSlug" IS NULL
            and s."parentSlug" is not null
            and s."tenantId" = :tenantId
            ${searchQuery}
            GROUP BY s."id"
            ORDER BY s."name"
            ${this.getPaginationString(criteria)};
            `,
      {
        replacements: {
          tenantId: this.currentTenant.id,
          name: `%${criteria.filter?.name}%`,
          status: criteria.filter?.status,
          parent_slug: `${criteria.filter?.parentSlug}`,
        },
        type: QueryTypes.SELECT,
      },
    )

    const subprojects = projects.map((p) => p.subprojects).flat()
    const integrationsBySegments = await this.queryIntegrationsForSubprojects(subprojects)

    const count = projects.length > 0 ? Number.parseInt(projects[0].totalCount, 10) : 0

    const rows = projects.map((i) => removeFieldsFromObject(i, 'totalCount'))

    // assign integrations to subprojects
    rows.forEach((row) => {
      row.subprojects.forEach((subproject) => {
        subproject.integrations = integrationsBySegments[subproject.id] || []
      })
    })

    return { count, rows, limit: criteria.limit, offset: criteria.offset }
  }

  async getDefaultSegment() {
    const segments = await this.querySubprojects({ limit: 1, offset: 0 })
    return segments.rows[0] || null
  }

  async querySubprojects(criteria: QueryData): Promise<PageData<SegmentData>> {
    let searchQuery = ''

    if (criteria.filter?.status) {
      searchQuery += ` AND s.status = :status`
    }

    if (criteria.filter?.name) {
      searchQuery += ` AND s.name ilike :name`
    }

    if (criteria.filter?.parentSlug) {
      searchQuery += ` AND s."parentSlug" = :parent_slug `
    }

    if (criteria.filter?.grandparentSlug) {
      searchQuery += ` AND s."grandparentSlug" = :grandparent_slug `
    }

    const subprojects = await this.options.database.sequelize.query(
      `
        SELECT
          s.*
        FROM segments s
        WHERE s."grandparentSlug" IS NOT NULL
          AND s."parentSlug" IS NOT NULL
          AND s."tenantId" = :tenantId
          ${searchQuery}
        ORDER BY s.name
        ${this.getPaginationString(criteria)};
      `,
      {
        replacements: {
          tenantId: this.currentTenant.id,
          name: `%${criteria.filter?.name}%`,
          status: criteria.filter?.status,
          parent_slug: `${criteria.filter?.parentSlug}`,
          grandparent_slug: `${criteria.filter?.grandparentSlug}`,
          ids: criteria.filter?.ids,
        },
        type: QueryTypes.SELECT,
      },
    )

    const rows = subprojects

    return {
      count: 1,
      rows: rows.map((sr) => SegmentRepository.populateRelations(sr)),
      limit: criteria.limit,
      offset: criteria.offset,
    }
  }

  private async queryIntegrationsForSubprojects(subprojects) {
    const segmentIds = subprojects.map((i) => i.id)
    let { rows: integrations } = await IntegrationRepository.findAndCountAll(
      {
        advancedFilter: {
          segmentId: segmentIds,
        },
      },
      {
        ...this.options,
        currentSegments: subprojects,
      },
    )

    integrations = integrations.map(({ platform, id, status, segmentId }) => ({
      platform,
      id,
      status,
      segmentId,
    }))

    return lodash.groupBy(integrations, 'segmentId')
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

    const customActivityTypes = record.customActivityTypes || {}

    if (Object.keys(customActivityTypes).length > 0) {
      activityTypes.custom = customActivityTypes
    }

    return activityTypes
  }

  static getActivityTypes(options: IRepositoryOptions): ActivityTypeSettings {
    return options.currentSegments.reduce((acc, s) => lodash.merge(acc, s.activityTypes), {})
  }

  static async fetchTenantActivityTypes(options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const [record] = await options.database.sequelize.query(
      `
        SELECT
            jsonb_merge_agg(s."customActivityTypes") AS "customActivityTypes"
        FROM segments s
        WHERE s."grandparentSlug" IS NOT NULL
          AND s."parentSlug" IS NOT NULL
          AND s."tenantId" = :tenantId
          AND s."customActivityTypes" != '{}'
      `,
      {
        replacements: {
          tenantId: options.currentTenant.id,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return SegmentRepository.buildActivityTypes(record)
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

  async findBySourceIds(sourceIds: string[]) {
    const transaction = SequelizeRepository.getTransaction(this.options)
    const seq = SequelizeRepository.getSequelize(this.options)

    if (!sourceIds || !sourceIds.length) {
      return []
    }

    const segments = await seq.query(
      `
        SELECT
            DISTINCT UNNEST(ARRAY[s.id, s1.id, s2.id]) AS id
        FROM segments s
        JOIN segments s1 ON s1."parentSlug" = s.slug
        JOIN segments s2 ON s2."parentSlug" = s1.slug
        WHERE s."tenantId" = :tenantId
          AND s."sourceId" IN (:sourceIds)
      `,
      {
        replacements: { sourceIds, tenantId: this.options.currentTenant.id },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return segments.map((i: any) => i.id)
  }
}

export default SegmentRepository
