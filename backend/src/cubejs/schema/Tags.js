cube(`Tags`, {
  sql_table: 'tags',

  preAggregations: {},

  joins: {},

  dimensions: {
    name: {
      sql: `name`,
      type: `string`,
    },
  },
})
