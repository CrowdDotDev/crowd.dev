cube(`Members`, {
  sql: `SELECT M.*, 
		  case 
		 	when DATE_PART('day', MIN(a.timestamp)::timestamp - M."joinedAt"::TIMESTAMP) < 0 THEN 0
		 	WHEN MIN(M."joinedAt") < '1980-01-01' THEN 0
		 	WHEN MIN(a.timestamp) IS NULL THEN DATE_PART('day', NOW()::timestamp - M."joinedAt"::TIMESTAMP)
		 	else
		 	DATE_PART('day', MIN(a.timestamp)::timestamp - M."joinedAt"::TIMESTAMP)
		 	end
		 
		  AS time_to_first_interaction FROM "communityMembers" m
LEFT JOIN activities a ON (a."communityMemberId" = m.id AND a."isKeyAction"=TRUE)
WHERE m.type ='member'
GROUP BY m.id`,

  preAggregations: {
    Members: {
      measures: [Members.count],
      dimensions: [Members.score, Members.location, Members.organisation, Members.tenantId],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    ActiveMembers: {
      measures: [Members.count],
      dimensions: [
        Members.score,
        Members.location,
        Members.organisation,
        Members.tenantId,
        Tags.name,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersActivities: {
      measures: [Members.count],
      dimensions: [Members.tenantId, Activities.platform, Activities.type],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },

    MembersTags: {
      measures: [Members.count],
      dimensions: [Members.tenantId, Tags.name],
      timeDimension: Members.joinedAt,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },
  },

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."communityMemberId"`,
      relationship: `hasMany`,
    },

    MemberTags: {
      sql: `${CUBE}.id = ${MemberTags}."communityMemberId"`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
    },

    averageTimeToFirstInteraction: {
      type: 'avg',
      sql: `time_to_first_interaction`,
      shown: false,
    },
  },

  dimensions: {
    bio: {
      sql: `bio`,
      type: `string`,
      shown: false,
    },

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
      sql: `location`,
      type: `string`,
    },

    info: {
      sql: `info`,
      type: `string`,
      shown: false,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    type: {
      sql: `type`,
      type: `string`,
      shown: false,
    },

    organisation: {
      sql: `organisation`,
      type: `string`,
    },

    crowdinfo: {
      sql: `${CUBE}."crowdInfo"`,
      type: `string`,
      shown: false,
    },

    importhash: {
      sql: `${CUBE}."importHash"`,
      type: `string`,
      shown: false,
    },

    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
      shown: false,
    },

    signals: {
      sql: `signals`,
      type: `string`,
      shown: false,
    },

    username: {
      sql: `username`,
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
    score: {
      sql: `${CUBE}."score"`,
      type: `number`,
    },
  },
})
