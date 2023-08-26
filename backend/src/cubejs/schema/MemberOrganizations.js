cube(`MemberOrganizations`, {
  sql_table: '"memberOrganizations"',

  preAggregations: {},

  joins: {
    Organizations: {
      sql: `${CUBE}."organizationId" = ${Organizations}.id`,
      relationship: `belongsTo`,
    },

    Activities: {
      sql: `${CUBE}."memberId" = ${Activities}."memberId"`,
      relationship: `hasMany`,
    },
  },

  measures: {},

  dimensions: {},
})
