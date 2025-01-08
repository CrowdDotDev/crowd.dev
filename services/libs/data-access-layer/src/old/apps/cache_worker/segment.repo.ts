import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IDashboardCacheLastRefreshedAt, ISegment } from './types'

class SegmentRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async getAllSegments(limit: number, offset: number): Promise<ISegment[]> {
    let rows: ISegment[] = []
    try {
      rows = await this.connection.query(
        `
        select 
            id as "segmentId",
            slug,
            "parentSlug",
            "grandparentSlug"
        from segments
        order by id asc
        limit $(limit)
        offset $(offset)
          
      `,
        {
          limit,
          offset,
        },
      )
    } catch (err) {
      this.log.error('Error while getting all segments', err)

      throw new Error(err)
    }

    return rows || []
  }

  // getProjectLeafSegments
  async getProjectLeafSegments(parentSlug: string): Promise<ISegment[]> {
    let rows: ISegment[] = []
    try {
      rows = await this.connection.query(
        `
        select 
        id as "segmentId", 
        slug, 
        "parentSlug", 
        "grandparentSlug"
    from segments
    where "parentSlug" = $(parentSlug)
    and slug is not null 
    and "grandparentSlug" is not null;
          
      `,
        {
          parentSlug,
        },
      )
    } catch (err) {
      this.log.error(`Error while getting leaf segments of project ${parentSlug}`, err)

      throw new Error(err)
    }

    return rows || []
  }

  async getProjectGroupLeafSegments(
    grandparentSlug: string,
  ): Promise<ISegment[]> {
    let rows: ISegment[] = []
    try {
      rows = await this.connection.query(
        `
        select 
        id as "segmentId", 
        slug, 
        "parentSlug", 
        "grandparentSlug"
    from segments
    where "grandparentSlug" = $(grandparentSlug)
    and slug is not null 
    and "parentSlug" is not null;
          
      `,
        {
          grandparentSlug,
        },
      )
    } catch (err) {
      this.log.error(`Error while getting leaf segments of project group ${grandparentSlug}`, err)

      throw new Error(err)
    }

    return rows || []
  }

  async getDefaultSegment(): Promise<ISegment> {
    let result: ISegment
    try {
      result = await this.connection.oneOrNone(
        `
        select 
        id as "segmentId", 
        slug, 
        "parentSlug", 
        "grandparentSlug"
    from segments
    where slug is not null 
    and "parentSlug" is not null
    and "grandparentSlug" is not null;
          
      `
      )
    } catch (err) {
      this.log.error(`Error while getting the default segment!`, err)

      throw new Error(err)
    }

    return result
  }

  async getDashboardCacheLastRefreshedAt(segmentId: string): Promise<string> {
    try {
      const result: IDashboardCacheLastRefreshedAt = await this.connection.oneOrNone(
        `
        select "dashboardCacheLastRefreshedAt"
        from segments
        where "id" = $(segmentId);`,
        {
          segmentId,
        },
      )
      return result?.dashboardCacheLastRefreshedAt
    } catch (err) {
      throw new Error(err)
    }
  }

  async updateDashboardCacheLastRefreshedAt(segmentId: string): Promise<void> {
    try {
      await this.connection.any(
        `
          update segments set "dashboardCacheLastRefreshedAt" = now()
          where "id" = $(segmentId);
        `,
        {
          segmentId,
        },
      )
    } catch (err) {
      throw new Error(err)
    }
  }
}

export default SegmentRepository
