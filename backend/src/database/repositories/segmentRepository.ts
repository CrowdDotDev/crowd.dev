import { v4 as uuid } from 'uuid'
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'
import { SegmentCriteria, SegmentData, SegmentStatus } from '../../types/segmentTypes'
import SequelizeTestUtils from '../utils/sequelizeTestUtils'
import { PageData } from '../../types/common'

class SegmentRepository extends RepositoryBase<
    SegmentData,
    string,
    SegmentData,
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
    async create(data: SegmentData): Promise<SegmentData> {
        const segmentInsertResult = await this.options.database.sequelize.query(
            `INSERT INTO "segments" ("id", "name", "slug", "parentSlug", "grandparentSlug", "status", "parentName", "sourceId", "sourceParentId", "tenantId")
          VALUES
              (:id, :name, :slug, :parentSlug, :grandparentSlug, :status, :parentName, :sourceId, :sourceParentId, :tenantId)
          RETURNING "id"
        `,
            {
                replacements: {
                    id: uuid(),
                    name: data.name,
                    slug: data.slug,
                    parentSlug: data.parentSlug || null,
                    grandparentSlug: data.grandparentSlug || null,
                    status: data.status || SegmentStatus.ACTIVE,
                    parentName: data.parentName || null,
                    sourceId: data.sourceId || null,
                    sourceParentId: data.sourceParentId || null,
                    tenantId: data.tenantId,
                },
                type: QueryTypes.INSERT,
            },
        )

        const segment = await this.findById(segmentInsertResult[0][0].id)
        return segment
    }

    async getChildrenOfProjectGroups(slug: string) {
        const records = await this.options.database.sequelize.query(
            `
                select * from segments s
                where s."grandparentSlug" = :slug;
            `,
            {
                replacements: {
                    slug,
                },
                type: QueryTypes.SELECT,
            },
        )

        return records
    }

    async getChildrenOfProjects(slug: string) {
        const records = await this.options.database.sequelize.query(
            `
                select * from segments s
                where s."parentSlug" = :slug;
            `,
            {
                replacements: {
                    slug,
                },
                type: QueryTypes.SELECT,
            },
        )

        return records
    }

    async findById(id: string): Promise<SegmentData> {
        const records = await this.options.database.sequelize.query(
            `SELECT *
             FROM segments
             WHERE id = :id;
            `,
            {
                replacements: {
                    id,
                },
                type: QueryTypes.SELECT,
            },
        )

        if (records.length === 0) {
            return null
        }

        const record = records[0]

        if (SegmentRepository.isProjectGroup(record)) {
            // find projects
            const children = await this.getChildrenOfProjectGroups(record.slug)

            const projects = children.reduce((acc, child) => {
                
                if (SegmentRepository.isProject(child)) {
                    acc.push(child)
                }
                else if (SegmentRepository.isSubproject(child)) {
                    // find project index
                    const projectIndex =                   
                }
            }, [])


        }

        return records[0]
    }

    static isProjectGroup(segment: SegmentData): boolean {
        return segment.slug && segment.parentSlug === null && segment.grandparentSlug === null
    }

    static isProject(segment: SegmentData): boolean {
        return segment.slug && segment.parentSlug && segment.grandparentSlug === null
    }

    static isSubproject(segment: SegmentData): boolean {
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
                    status: criteria.status
                },
                type: QueryTypes.SELECT,
            },
        )

        const count = projectGroups.length > 0 ? projectGroups[0].totalCount : 0

        const rows = projectGroups.map( i => SequelizeTestUtils.objectWithoutKey(i, 'totalCount'))

        // TODO: Add member count to segments after implementing member relations
        return { count, rows, limit: criteria.limit, offset: criteria.offset }

    }

    async listProjects(): Promise<SegmentData[]> {
        const records = await this.options.database.sequelize.query(
            `SELECT *
             FROM segments
             WHERE "parentSlug" is null and "grandparentSlug" is null
            `,
            {
                type: QueryTypes.SELECT,
            },
        )

        // TODO: Add member count to segments after implementing member relations

        return records
    }
}

export default SegmentRepository
