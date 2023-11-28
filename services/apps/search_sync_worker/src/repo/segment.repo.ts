import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbSegmentInfo } from './segment.data'

export class SegmentRepository extends RepositoryBase<SegmentRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getParentSegmentIds(childSegmentIds: string[]): Promise<IDbSegmentInfo[]> {
    console.log('Getting parent segmentIds!')
    console.log(childSegmentIds)
    try {
      const query = `select s.id, pd.id as "parentId", gpd.id as "grandParentId"
      from segments s
              inner join segments pd
                          on pd."tenantId" = s."tenantId" and pd.slug = s."parentSlug" and pd."grandparentSlug" is null and
                            pd."parentSlug" is not null
              inner join segments gpd on gpd."tenantId" = s."tenantId" and gpd.slug = s."grandparentSlug" and
                                          gpd."grandparentSlug" is null and gpd."parentSlug" is null
      where s.id in ($(childSegmentIds:csv));`
      console.log(query)
      const results = await this.db().any(query, {
        childSegmentIds,
      })
      console.log('Done getting results!')
      console.log(results)
      return results
    } catch (e) {
      console.log('Error while getting parent segment ids! ')
      console.log(e)
    }
  }
}
