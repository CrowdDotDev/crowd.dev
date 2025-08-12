module.exports = {
  get(key) {
    if (key === 'queue') {
      return {
        host: process.env.QUEUE_HOST || 'localhost',
        port: Number(process.env.QUEUE_PORT || 1234),
        ssl: process.env.QUEUE_SSL === 'true',
      }
    }
    if (key === 'encryption') {
      return {
        initVector: process.env.ENCRYPTION_INIT_VECTOR || 'default',
        secretKey: process.env.ENCRYPTION_SECRET_KEY || 'default',
      }
    }
    if (key === 'redis') {
      return {
        host: process.env.REDIS_HOST || 'localhost',
        password: process.env.REDIS_PASSWORD || 'default',
        port: Number(process.env.REDIS_PORT || 6379),
        username: process.env.REDIS_USERNAME || 'default',
      }
    }
    if (key === 's3') {
      return {
        aws: {},
        host: process.env.S3_HOST || 'localhost',
        integrationsAssetsBucket:
          process.env.S3_INTEGRATIONS_ASSETS_BUCKET || 'integrations-assets',
        microservicesAssetsBucket:
          process.env.S3_MICROSERVICES_ASSETS_BUCKET || 'microservices-assets',
        port: Number(process.env.S3_PORT || 9000),
      }
    }
    if (key === 'db') {
      return {
        apiPassword: process.env.DB_API_PASSWORD || 'api',
        apiUsername: process.env.DB_API_USERNAME || 'api',
        database: process.env.DB_DATABASE || 'crowd_dev',
        dialect: process.env.DB_DIALECT || 'postgres',
        jobGeneratorPassword: process.env.DB_JOB_GENERATOR_PASSWORD || 'job_generator',
        jobGeneratorUsername: process.env.DB_JOB_GENERATOR_USERNAME || 'job_generator',
        logging: process.env.DB_LOGGING === 'true',
        password: process.env.DB_PASSWORD || 'default',
        port: Number(process.env.DB_PORT || 5432),
        readHost: process.env.DB_READ_HOST || 'localhost',
        transaction: true,
        username: process.env.DB_USERNAME || 'default',
        writeHost: process.env.DB_WRITE_HOST || 'localhost',
      }
    }
    if (key === 'segment') {
      return {
        writeKey: process.env.SEGMENT_WRITE_KEY || 'default',
      }
    }
    if (key === 'comprehend') {
      return {
        aws: {},
      }
    }
    if (key === 'clearbit') {
      return {}
    }
    if (key === 'api') {
      return {}
    }
    if (key === 'auth0') {
      return {}
    }
    if (key === 'sso') {
      return {}
    }
    if (key === 'twitter') {
      return {}
    }
    if (key === 'slack') {
      return {}
    }
    if (key === 'google') {
      return {}
    }
    if (key === 'discord') {
      return {}
    }
    if (key === 'github') {
      return {}
    }
    if (key === 'githubIssueReporter') {
      return {}
    }
    if (key === 'jiraIssueReporter') {
      return {}
    }
    if (key === 'nango') {
      return {}
    }
    if (key === 'enrichment') {
      return {}
    }
    if (key === 'organizationEnrichment') {
      return {}
    }
    if (key === 'eagleEye') {
      return {}
    }
    if (key === 'githubToken') {
      return {}
    }
    if (key === 'opensearch') {
      return {}
    }
    if (key === 'stackexchange') {
      return {}
    }
    if (key === 'slackAlerting') {
      return {}
    }
    if (key === 'integrationProcessing') {
      return {}
    }
    if (key === 'crowdAnalytics') {
      return {}
    }
    if (key === 'temporal') {
      return {}
    }
    if (key === 'searchSyncApi') {
      return {}
    }
    if (key === 'openStatusApi') {
      return {}
    }
    if (key === 'gitlab') {
      return {}
    }
    if (key === 'reddit') {
      return {}
    }
    if (key === 'snowflake') {
      return {}
    }
    throw new Error(`Config key not mocked in tests: ${key}`)
  },
  has(key) {
    return ['queue', 'encryption', 'redis', 's3', 'db'].includes(key)
  },
}
