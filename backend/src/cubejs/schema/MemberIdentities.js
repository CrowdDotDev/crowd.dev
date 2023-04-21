cube(`MemberIdentities`, {
  sql: `select distinct "memberId", platform AS "identityName" from "memberIdentities"`,

  preAggregations: {},

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
