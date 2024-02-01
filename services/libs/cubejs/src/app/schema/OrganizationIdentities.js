cube('OrganizationIdentities', {
  sql_table: '"organizationIdentities"',

  preAggregations: {},

  joins: {
    Organizations: {
      sql: `${CUBE}."organizationId" = ${Organizations}.id`,
      relationship: 'belongsTo',
    },
  },

  measures: {},

  dimensions: {
    platform: {
      sql: `${CUBE}.platform`,
      type: 'string',
    },
    name: {
      sql: `${CUBE}.name`,
      type: 'string',
    },
  },
})
