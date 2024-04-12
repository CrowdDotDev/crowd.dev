import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberSegment, IMemberSegmentAggregates } from './member.data'
import { IOrganizationSegment, IOrganizationSegmentAggregates } from './organization.data'

// questdb
export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async membersWithActivities(memberIds: string[]): Promise<string[]> {
    const results = await this.db().any(
      `
      select distinct "memberId" from activities where "deletedAt" is null and "memberId" in ($(memberIds:csv))
      `,
      {
        memberIds,
      },
    )

    return results.map((r) => r.memberId)
  }

  public async getMemberSegmentCouples(memberIds: string[]): Promise<IMemberSegment[]> {
    return this.db().any(
      `
      select distinct "memberId", "segmentId" 
      from activities 
      where "deletedAt" is null and "memberId" in ($(memberIds:csv));
      `,
      {
        memberIds,
      },
    )
  }

  public async getMemberAggregateData(
    memberId: string,
    segmentId: string,
  ): Promise<IMemberSegmentAggregates> {
    const result = await this.db().oneOrNone(
      `
      with relevant_activities as (select id, platform, type, timestamp, "sentimentScore", "memberId", "segmentId"
                                  from activities
                                  where "memberId" = $(memberId)
                                    and "segmentId" = $(segmentId)
                                    and "deletedAt" is null),
          activity_types as (select distinct "memberId", "segmentId", type, platform
                              from relevant_activities
                              where platform is not null
                                and type is not null),
          distinct_platforms as (select distinct "memberId", "segmentId", platform from relevant_activities),
          average_sentiment as (select "memberId", "segmentId", avg("sentimentScore") as "averageSentiment"
                                from relevant_activities
                                where "sentimentScore" is not null)
      select a."memberId",
            a."segmentId",
            count(a.id)                                      as "activityCount",
            max(a.timestamp)                                 as "lastActive",
            string_agg(p.platform, ':')                      as "activeOn",
            string_agg(concat(t.platform, ':', t.type), '|') as "activityTypes",
            count_distinct(date_trunc('day', now()))         as "activeDaysCount",
            s."averageSentiment"
      from relevant_activities a
              inner join activity_types t on a."memberId" = t."memberId" and a."segmentId" = t."segmentId"
              inner join distinct_platforms p on a."memberId" = p."memberId" and a."segmentId" = p."segmentId"
              left join average_sentiment s on a."memberId" = s."memberId" and a."segmentId" = s."segmentId"
      group by a."memberId", a."segmentId", s."averageSentiment";
      `,
      {
        memberId,
        segmentId,
      },
    )

    if (result) {
      return {
        memberId,
        segmentId,
        activityCount: result.activityCount,
        lastActive: result.lastActive,
        activeOn: result.activeOn.split(':'),
        activityTypes: result.activityTypes.split('|'),
        activeDaysCount: result.activeDaysCount,
        averageSentiment: result.averageSentiment,
      }
    } else {
      return {
        memberId,
        segmentId,
        activityCount: 0,
        lastActive: undefined,
        activeOn: [],
        activityTypes: [],
        activeDaysCount: 0,
        averageSentiment: null,
      }
    }
  }

  public async getOrganizationSegmentCouples(
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
