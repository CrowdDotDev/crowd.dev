cube(`MemberSegments`, {
  sql: `SELECT *
        FROM public."memberSegments"`,

  preAggregations: {},

  joins: {
    Members: {
      sql: `${CUBE}."memberId" = ${Members}.id`,
      relationship: `belongsTo`,
    },

    Segments: {
      sql: `${CUBE}."segmentId" = ${Segments}."id"`,
      relationship: `belongsTo`,
    },
  },

  measures: {},

  dimensions: {
    id: {
      sql: `${CUBE}."segmentId" || '-' || ${CUBE}."memberId"`,
      type: `string`,
      primaryKey: true,
    },
    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },
  },
})
