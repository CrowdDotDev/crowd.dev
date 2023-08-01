cube(`Members`, {
  sql: `
    with identities as (
      select string_agg(platform, '|') as platforms, "memberId" from "memberIdentities" group by "memberId"
    )
    SELECT M.*, 
		  CASE 
		 	    WHEN DATE_PART('day', MIN(a.timestamp)::timestamp - M."joinedAt"::TIMESTAMP) < 0 THEN 0
		 	    WHEN MIN(M."joinedAt") < '1980-01-01' THEN 0
		 	    WHEN MIN(a.timestamp) IS NULL THEN DATE_PART('day', NOW()::timestamp - M."joinedAt"::TIMESTAMP)
		 	ELSE
		 	    DATE_PART('day', MIN(a.timestamp)::timestamp - M."joinedAt"::TIMESTAMP)
		 	END AS time_to_first_interaction,
      i.platforms AS identities
      FROM "members" m
      INNER JOIN identities i ON i."memberId" = m.id
      LEFT JOIN activities a ON (a."memberId" = m.id AND a."isContribution"=TRUE)
      GROUP BY m.id, i.platforms`,

  preAggregations: {
    MembersCumulative: {
      measures: [Members.cumulativeCount],
      dimensions: [
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Segments.id,
        Activities.platform,
      ],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByJoinedAtPure: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Segments.id,
      ],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByJoinedAtTags: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Segments.id,
        Tags.name,
      ],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByJoinedAtPlatform: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Segments.id,
        Activities.platform,
      ],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByActivityPure: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.joinedAtUnixTs,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Segments.id,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByActivityPlatform: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.joinedAtUnixTs,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Segments.id,
        Activities.platform,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByActivityActivityType: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Members.joinedAtUnixTs,
        Segments.id,
        Activities.type,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersByActivityIsContribution: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Members.joinedAtUnixTs,
        Segments.id,
        Activities.iscontribution,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },
  },

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."memberId"`,
      relationship: `hasMany`,
    },

    MemberTags: {
      sql: `${CUBE}.id = ${MemberTags}."memberId"`,
      relationship: `belongsTo`,
    },

    MemberOrganizations: {
      sql: `${CUBE}.id = ${MemberOrganizations}."memberId"`,
      relationship: `belongsTo`,
    },

    MemberIdentities: {
      sql: `${CUBE}.id = ${MemberIdentities}."memberId"`,
      relationship: `belongsTo`,
    },

    MemberSegments: {
      sql: `${CUBE}.id = ${MemberSegments}."memberId"`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
    },

    earliestJoinedAt: {
      type: `min`,
      sql: `${Members}."joinedAt"`,
      shown: false,
    },

    averageTimeToFirstInteraction: {
      type: 'avg',
      sql: `time_to_first_interaction`,
      shown: false,
    },

    cumulativeCount: {
      type: `count`,
      rollingWindow: {
        trailing: `unbounded`,
      },
    },
  },

  dimensions: {
    email: {
      sql: `email`,
      type: `string`,
      shown: false,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },

    location: {
      sql: `COALESCE(${CUBE}.attributes->'location'->>'default', '')`,
      type: `string`,
    },

    bio: {
      sql: `COALESCE(${CUBE}.attributes->'bio'->>'default', '')`,
      type: `string`,
    },

    info: {
      sql: `info`,
      type: `string`,
      shown: false,
    },

    isTeamMember: {
      sql: `COALESCE((${CUBE}.attributes->'isTeamMember'->'default')::boolean, false)`,
      type: `boolean`,
    },

    isBot: {
      sql: `COALESCE((${CUBE}.attributes->'isBot'->'default')::boolean, false)`,
      type: `boolean`,
    },

    isOrganization: {
      sql: `COALESCE((${CUBE}.attributes->'isOrganization'->'default')::boolean, false)`,
      type: `boolean`,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
      shown: false,
    },

    username: {
      sql: `${CUBE}."displayName"`,
      type: `string`,
      shown: false,
    },

    createdbyid: {
      sql: `${CUBE}."createdById"`,
      type: `string`,
      shown: false,
    },

    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
      shown: false,
    },

    updatedat: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`,
      shown: false,
    },

    deletedat: {
      sql: `${CUBE}."deletedAt"`,
      type: `time`,
      shown: false,
    },

    joinedAt: {
      sql: `${CUBE}."joinedAt"`,
      type: `time`,
    },

    joinedAtUnixTs: {
      sql: `EXTRACT(EPOCH FROM ${CUBE}."joinedAt")`,
      type: `number`,
    },

    score: {
      sql: `${CUBE}."score"`,
      type: `number`,
    },

    identities: {
      sql: `${CUBE}."identities"`,
      type: `string`,
    },
  },
})
