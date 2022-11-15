/* eslint-disable no-restricted-globals */
cube(`Identities`, {
  sql: `select distinct unnest(ARRAY(SELECT jsonb_object_keys(m.username))) AS name, "m"."tenantId" as "tenantId"
    from members m`,

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
      sql: `name`,
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
