import { DbStore, RepositoryBase } from '@crowd/database'
import { IOrganizationSegment, IOrganizationSegmentAggregates } from './organization.data'
import { Logger } from '@crowd/logging'

// questdb
export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getOrganizationSegmentCoupleso(
    organizationIds: string[],
  ): Promise<IOrganizationSegment[]> {
    return this.db().any(
      `
      select distinct "organizationId", "segmentId" 
      from activities 
      where "deletedAt" is null and "organizationId" in ($(organizationIds:csv));
      `,
      {
        organizationIds,
      },
    )
  }

  public async getOrganizationAggregateData(
    organizationId: string,
    segmentId: string,
  ): Promise<IOrganizationSegmentAggregates> {
    const result = await this.db().oneOrNone(
      `
      with relevant_activities as (select id, timestamp, platform, "memberId", "organizationId", "segmentId"
                                  from activities
                                  where "organizationId" = $(organizationId)
                                    and "segmentId" = $(segmentId)
                                    and "deletedAt" is null),
          distinct_platforms as (select distinct "organizationId", "segmentId", platform from relevant_activities),
          distinct_members as (select distinct "organizationId", "segmentId", "memberId" from relevant_activities),
          joined_at_timestamp as (select "organizationId", "segmentId", min(timestamp) as "joinedAt"
                                  from relevant_activities
                                  where timestamp <> '1970-01-01T00:00:00.000Z')
      select a."organizationId",
            a."segmentId",
            count_distinct(a."memberId")  as "memberCount",
            count_distinct(a.id)          as "activityCount",
            max(a.timestamp)              as "lastActive",
            string_agg(p.platform, ':')   as "activeOn",
            string_agg(m."memberId", ':') as "memberIds",
            t."joinedAt"
      from relevant_activities a
              inner join distinct_platforms p on a."organizationId" = p."organizationId" and a."segmentId" = p."segmentId"
              inner join distinct_members m on a."organizationId" = m."organizationId" and a."segmentId" = m."segmentId"
              left join joined_at_timestamp t on a."organizationId" = t."organizationId" and a."segmentId" = t."segmentId"
      group by a."organizationId", a."segmentId", t."joinedAt";
      `,
      {
        organizationId,
        segmentId,
      },
    )

    if (result) {
      return {
        organizationId,
        segmentId,
        memberIds: result.memberIds.split(':'),
        memberCount: result.memberCount,
        activityCount: result.activityCount,
        activeOn: result.activeOn.split(':'),
        lastActive: result.lastActive,
        joinedAt: result.joinedAt,
      }
    } else {
      return {
        organizationId,
        segmentId,
        memberIds: [],
        memberCount: 0,
        activityCount: 0,
        activeOn: [],
        lastActive: null,
        joinedAt: null,
      }
    }
  }
}
