cube(`Activities`, {
  sql_table: 'mv_activities_cube',

  measures: {
    count: {
      sql: `${CUBE}.id`,
      type: 'count_distinct',
      drillMembers: [tenantId, date],
    },
    cumulativeCount: {
      type: `count`,
      rollingWindow: {
        trailing: `unbounded`,
      },
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    iscontribution: {
      sql: `${CUBE}."isContribution"`,
      type: `string`,
    },

    sentimentMood: {
      sql: `${CUBE}."sentimentMood"`,
      type: `string`,
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

    type: {
      sql: `type`,
      type: `string`,
    },

    date: {
      sql: `timestamp`,
      type: `time`,
    },
  },
})
