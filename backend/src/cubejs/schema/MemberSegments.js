cube('MemberSegments', {
  sql_table: '"memberSegments"',

  preAggregations: {},

  joins: {
    Members: {
      sql: `${CUBE}."memberId" = ${Members}.id`,
      relationship: 'belongsTo',
    },

    Segments: {
      sql: `${CUBE}."segmentId" = ${Segments}."id"`,
      relationship: 'belongsTo',
    },
  },

  measures: {},

  dimensions: {},
})
