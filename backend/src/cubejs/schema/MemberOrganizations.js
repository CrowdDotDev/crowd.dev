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

  dimensions: {
    id: {
      sql: `${CUBE}."memberId" || '-' || ${CUBE}."organizationid"`,
      type: `string`,
      primaryKey: true,
    },

    organizationid: {
      sql: `${CUBE}."organizationId"`,
      type: `string`,
      shown: false,
    },

    memberid: {
      sql: `${CUBE}."memberId"`,
      type: `string`,
      shown: false,
    },

    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
      shown: false,
    },

    updatedat: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`,
      shown: false,
    },
  },
})
