cube(`Sentiment`, {
  sql: `select
  a."tenantId" ,
  a."platform" ,
  a."timestamp" ,
  (a.sentiment->>'sentiment')::integer as sentiment,
  case
      when (a.sentiment->>'sentiment')::integer < 50 then 'negative'
      else 'positive'
  end as mood
from
  activities a
where
  a.sentiment->>'sentiment' is not null`,

  preAggregations: {
    Sentiment: {
      measures: [Sentiment.averageSentiment],
      dimensions: [Sentiment.platform, Sentiment.mood, Sentiment.tenantId],
      timeDimension: Sentiment.date,
      granularity: `day`,
      refreshKey: {
        every: `10 minute`,
      },
    },
  },

  /*
  joins: {
    Members: {
      sql: `${CUBE}."memberId" = ${Members}."id"`,
      relationship: `belongsTo`,
    },
  },
  */

  measures: {
    averageSentiment: {
      type: 'avg',
      sql: `sentiment`,
      // shown: false,
    },
  },

  dimensions: {
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

    platform: {
      sql: `platform`,
      type: `string`,
    },

    mood: {
      sql: `mood`,
      type: `string`,
    },

    date: {
      sql: `timestamp`,
      type: `time`,
    },
  },
})
