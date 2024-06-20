cube('Activities', {
  sql_table: 'mv_activities_cube',

  measures: {
    count: {
      sql: `${CUBE}.id`,
      type: 'count_distinct',
      drillMembers: [tenantId, date],
    },
    cumulativeCount: {
      type: 'count',
      rollingWindow: {
        trailing: 'unbounded',
      },
    },
  },

  joins: {
    Segments: {
      sql: `${CUBE}."segmentId" = ${Segments}."id"`,
      relationship: 'belongsTo',
    },
  },

  dimensions: {
    id: {
      sql: `${CUBE}.id`,
      type: 'string',
      primaryKey: true,
    },

    iscontribution: {
      sql: `${CUBE}."isContribution"`,
      type: 'string',
    },

    sentimentMood: {
      sql: `${CUBE}."sentimentMood"`,
      type: 'string',
    },

    platform: {
      sql: `${CUBE}.platform`,
      type: 'string',
    },

    channel: {
      sql: `${CUBE}.channel`,
      type: 'string',
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: 'string',
      shown: false,
    },

    type: {
      sql: `${CUBE}.type`,
      type: 'string',
    },

    date: {
      sql: `${CUBE}.timestamp`,
      type: 'time',
    },
  },
})
