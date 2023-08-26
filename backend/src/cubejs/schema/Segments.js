cube(`Segments`, {
  sql_table: 'mv_segments_cube',

  preAggregations: {},

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."segmentId"`,
      relationship: `hasMany`,
    },
    OrganizationSegments: {
      sql: `${CUBE}.id = ${OrganizationSegments}."segmentId"`,
      relationship: `belongsTo`,
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
