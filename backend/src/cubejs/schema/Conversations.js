cube(`Conversations`, {
  sql: `SELECT 
    con.*, 
    MAX(a.timestamp) AS "lastActive", 
    MIN(a.timestamp) AS "firstActivityTime",
    a.platform AS platform, 
    MAX(
      CASE WHEN (a."crowdInfo" ->> 'thread') IS NOT NULL 
           AND (a."crowdInfo" ->> 'thread') != 'false' 
           AND a.platform = 'discord' 
      THEN null 
      WHEN (a."crowdInfo" ->> 'channel') IS NOT NULL THEN a."crowdInfo" ->> 'channel' 
      WHEN (a."crowdInfo" ->> 'repo') IS NOT NULL THEN a."crowdInfo" ->> 'repo' ELSE NULL 
      END
    ) AS category 
  FROM 
    conversations con 
    LEFT JOIN activities a ON con.id = a."conversationId" 
  GROUP BY 
    con.id, 
    a.platform`,

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."conversationId"`,
      relationship: `hasMany`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [tenantId, createdbyid, updatedbyid, id, title, createdat, updatedat],
    },
  },

  dimensions: {
    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },

    createdbyid: {
      sql: `${CUBE}."createdById"`,
      type: `string`,
    },

    slug: {
      sql: `slug`,
      type: `string`,
    },

    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
    },

    published: {
      sql: `published`,
      type: `string`,
    },

    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    title: {
      sql: `title`,
      type: `string`,
    },

    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
    },

    updatedat: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`,
    },

    platform: {
      sql: `${CUBE}."platform"`,
      type: `string`,
    },

    category: {
      sql: `${CUBE}."category"`,
      type: `string`,
    },

    lastActive: {
      sql: `${CUBE}."lastActive"`,
      type: `time`,
    },

    firstActivityTime: {
      sql: `${CUBE}."firstActivityTime"`,
      type: `time`,
    },
  },
})
