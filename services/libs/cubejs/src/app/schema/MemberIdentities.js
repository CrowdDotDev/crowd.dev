cube('MemberIdentities', {
  sql_table: '"memberIdentities"',

  preAggregations: {},

  joins: {
    Members: {
      sql: `${CUBE}."memberId" = ${Members}.id`,
      relationship: 'belongsTo',
    },
  },

  measures: {},

  dimensions: {
    platform: {
      sql: `${CUBE}.platform`,
      type: 'string',
    },
    username: {
      sql: `${CUBE}.value`,
      type: 'string',
    },
    // type: {
    //   sql: `${CUBE}.type`,
    //   type: 'string',
    // },
  },
})
