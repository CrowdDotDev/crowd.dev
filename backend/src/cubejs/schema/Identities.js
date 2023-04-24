/* eslint-disable no-restricted-globals */
cube(`Identities`, {
  sql: `select distinct platform as name, "tenantId" from "memberIdentities"`,

  preAggregations: {},

  joins: {
    MemberIdentities: {
      sql: `${CUBE}.name = ${MemberIdentities}."identityName"`,
      relationship: `hasMany`,
    },
  },
  measures: {
    count: {
      type: `count`,
      drillMembers: [name],
    },
  },
  dimensions: {
    name: {
      sql: `${CUBE}.name`,
      type: `string`,
      primaryKey: true,
      shown: true,
    },
    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },
  },
})
