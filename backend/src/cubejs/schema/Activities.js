cube(`Activities`, {
  sql: `SELECT * FROM public.activities`,

  preAggregations: {
    Activities: {
      measures: [Activities.count],
      dimensions: [
        Activities.platform,
        Activities.type,
        Members.score,
        Members.location,
        Members.tenantId,
        Activities.tenantId,
        Tags.name,
      ],
      timeDimension: Activities.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },
  },

  joins: {
    Members: {
      sql: `${CUBE}."memberId" = ${Members}."id"`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [
        memberId,
        sourceid,
        tenantId,
        id,
        updatedbyid,
        parentid,
        createdbyid,
        createdat,
        updatedat,
        date,
      ],
    },
  },

  dimensions: {
    memberId: {
      sql: `${CUBE}."memberId"`,
      type: `string`,
      shown: false,
    },

    sourceid: {
      sql: `${CUBE}."sourceId"`,
      type: `string`,
      shown: false,
    },

    platform: {
      sql: `platform`,
      type: `string`,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },


    type: {
      sql: `type`,
      type: `string`,
    },

    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
      shown: false,
    },

    iskeyaction: {
      sql: `${CUBE}."isKeyAction"`,
      type: `string`,
      shown: false,
    },

    parentid: {
      sql: `${CUBE}."parentId"`,
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

    date: {
      sql: `timestamp`,
      type: `time`,
    },

    deletedat: {
      sql: `${CUBE}."deletedAt"`,
      type: `time`,
      shown: false,
    },
  },
})
