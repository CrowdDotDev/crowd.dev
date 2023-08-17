cube(`Tags`, {
  sql: `SELECT * FROM public.tags`,

  preAggregations: {},

  joins: {},

  measures: {
    count: {
      type: `count`,
      drillMembers: [name, id, updatedbyid, tenantId, createdbyid, createdat, updatedat], // eslint-disable-line no-restricted-globals
      shown: false,
    },
  },

  dimensions: {
    name: {
      sql: `name`,
      type: `string`,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
      shown: false,
    },

    importhash: {
      sql: `${CUBE}."importHash"`,
      type: `string`,
      shown: false,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },

    createdbyid: {
      sql: `${CUBE}."createdById"`,
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

    deletedat: {
      sql: `${CUBE}."deletedAt"`,
      type: `time`,
      shown: false,
    },
  },
})
