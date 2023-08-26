cube(`Segments`, {
  sql_table: 'mv_segments_cube',

  preAggregations: {},

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."segmentId"`,
      relationship: `hasMany`,
    },
  },

  dimensions: {
    name: {
      sql: `${CUBE}."name"`,
      type: `string`,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },
  },
})
