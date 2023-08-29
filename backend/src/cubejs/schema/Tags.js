cube(`Tags`, {
  sql_table: 'tags',

  preAggregations: {},

  joins: {},

  dimensions: {
    name: {
      sql: `${CUBE}.name`,
      type: `string`,
    },
  },
})
