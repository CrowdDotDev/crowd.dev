/* eslint-disable no-restricted-globals */
cube(`Segments`, {
  sql_table: 'segments',

  preAggregations: {},

  measures: {
    count: {
      type: `count`,
      drillMembers: [
        id,
        sourceId,
        sourceParentId,
        name,
        parentName,
        grandparentName,
        tenantId,
        createdAt,
        updatedAt,
      ],
    },
  },

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."segmentId"`,
      relationship: `hasMany`,
    },
    Conversations: {
      sql: `${CUBE}.id = ${Conversations}."segmentId"`,
      relationship: `hasMany`,
    },
    Tags: {
      sql: `${CUBE}.id = ${Tags}."segmentId"`,
      relationship: `hasMany`,
    },
  },

  dimensions: {
    status: {
      sql: `${CUBE}."status"`,
      type: `string`,
    },

    sourceId: {
      sql: `${CUBE}."sourceId"`,
      type: `string`,
    },

    sourceParentId: {
      sql: `${CUBE}."sourceParentId"`,
      type: `string`,
    },

    name: {
      sql: `${CUBE}."name"`,
      type: `string`,
    },

    parentName: {
      sql: `${CUBE}."parentName"`,
      type: `string`,
    },

    grandparentName: {
      sql: `${CUBE}."grandparentName"`,
      type: `string`,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },

    createdAt: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
      shown: false,
    },

    updatedAt: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`,
      shown: false,
    },
  },
})
