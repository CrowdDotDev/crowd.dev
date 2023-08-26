cube(`Sentiment`, {
  sql: `select
      a.id,
      a."tenantId" ,
      a."platform" ,
      a."timestamp" ,
      a."memberId" ,
      (a.sentiment->>'sentiment')::integer as sentiment,
      case
          when (a.sentiment->>'sentiment')::integer < 34 then 'negative'
          when (a.sentiment->>'sentiment')::integer > 66 then 'positive'
          else 'neutral'
      end as mood
    from
      activities a
    where
      a.sentiment->>'sentiment' is not null`,

  preAggregations: {
    Sentiment: {
      measures: [Sentiment.averageSentiment],
      dimensions: [Sentiment.platform, Sentiment.mood, Sentiment.tenantId, Segments.id],
      timeDimension: Sentiment.date,
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
    averageSentiment: {
      type: 'avg',
      sql: `sentiment`,
    },
  },

  dimensions: {
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

    platform: {
      sql: `platform`,
      type: `string`,
    },

    date: {
      sql: `timestamp`,
      type: `time`,
    },
  },
})
