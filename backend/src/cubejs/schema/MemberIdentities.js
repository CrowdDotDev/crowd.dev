cube(`MemberIdentities`, {
  sql: `select m.id as "memberId", unnest(ARRAY(SELECT jsonb_object_keys(m.username))) AS "identityName" from members m`,

  preAggregations: {
    // Pre-A  ggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started
  },

  joins: {
    Identities: {
      sql: `${CUBE}."identityName" = ${Identities}.name`,
      relationship: `belongsTo`,
    },
  },

  measures: {},

  dimensions: {
    id: {
      sql: `${CUBE}."memberId" || '-' || ${CUBE}."identityName"`,
      type: `string`,
      primaryKey: true,
    },

    identityName: {
      sql: `${CUBE}."identityName"`,
      type: `string`,
      shown: false,
    },

    memberId: {
      sql: `${CUBE}."memberId"`,
      type: `string`,
      shown: false,
    },
  },
})
