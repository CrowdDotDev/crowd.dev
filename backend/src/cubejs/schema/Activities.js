cube(`Activities`, {
  sql_table: 'activities',

  preAggregations: {
    Activities: {
      measures: [Activities.count],
      dimensions: [
        Activities.platform,
        Activities.type,
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Activities.tenantId,
        Segments.id,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },
    ActivitiesCumulative: {
      measures: [Activities.cumulativeCount],
      dimensions: [
        Activities.platform,
        Activities.type,
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Activities.tenantId,
        Segments.id,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },
    ActivitiesPTD: {
      measures: [Activities.count],
      dimensions: [
        Activities.platform,
        Activities.type,
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Activities.tenantId,
        Segments.id,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      partition_granularity: `month`,
      refreshKey: {
        sql: `SELECT MAX("updatedAt") FROM public.activities WHERE ${FILTER_PARAMS.Activities.date.filter(
          'timestamp',
        )}`,
        every: `30 minute`,
      },
    },
    ActivitiesCumulativePTD: {
      measures: [Activities.cumulativeCount],
      dimensions: [
        Activities.platform,
        Activities.type,
        Members.score,
        Members.location,
        Members.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Members.isOrganization,
        Activities.tenantId,
        Segments.id,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      partition_granularity: `month`,
      refreshKey: {
        sql: `SELECT MAX("updatedAt") FROM public.activities WHERE ${FILTER_PARAMS.Activities.date.filter(
          'timestamp',
        )}`,
        every: `30 minute`,
      },
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [
        memberId,
        sourceid,
        tenantId,
        id,
        updatedbyid,
        parentid,
        createdbyid,
        createdat,
        updatedat,
        date,
      ],
    },
    cumulativeCount: {
      type: `count`,
      rollingWindow: {
        trailing: `unbounded`,
      },
    },
  },

  dimensions: {
    memberId: {
      sql: `${CUBE}."memberId"`,
      type: `string`,
      shown: false,
    },

    sentimentMood: {
      case: {
        when: [
          { sql: `${CUBE}.sentiment->>'sentiment' is null`, label: `no data` },
          { sql: `(${CUBE}.sentiment->>'sentiment')::integer < 34`, label: `negative` },
          { sql: `(${CUBE}.sentiment->>'sentiment')::integer > 66`, label: `positive` },
        ],
        else: { label: `neutral` },
      },
      type: `string`,
    },

    sourceid: {
      sql: `${CUBE}."sourceId"`,
      type: `string`,
      shown: false,
    },

    platform: {
      sql: `platform`,
      type: `string`,
    },

    channel: {
      sql: `channel`,
      type: `string`,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
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
    },

    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
      shown: false,
    },

    iscontribution: {
      sql: `${CUBE}."isContribution"`,
      type: `string`,
      shown: true,
    },

    parentid: {
      sql: `${CUBE}."parentId"`,
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

    date: {
      sql: `timestamp`,
      type: `time`,
    },

    deletedat: {
      sql: `${CUBE}."deletedAt"`,
      type: `time`,
      shown: false,
    },
  },
})
