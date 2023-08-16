cube(`OrganizationSegments`, {
  sql_table: '"organizationSegments"',

  preAggregations: {},

  joins: {
    Organizations: {
      sql: `${CUBE}."organizationId" = ${Organizations}.id`,
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
      sql: `${CUBE}."segmentId" || '-' || ${CUBE}."organizationId"`,
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
