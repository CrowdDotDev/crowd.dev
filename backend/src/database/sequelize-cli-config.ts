const IS_TEST_ENV = process.env.NODE_ENV === 'test'
const IS_STAGING_ENV = process.env.NODE_ENV === 'staging'
const IS_PROD_ENV = process.env.NODE_ENV === 'production'

const dbEnvVars = {
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
  host: process.env.DATABASE_HOST_WRITE,
  dialect: process.env.DATABASE_DIALECT,
}

let currentEnvironmentVariables = {}

if (IS_TEST_ENV) {
  currentEnvironmentVariables = {
    test: { ...dbEnvVars },
  }
} else if (IS_STAGING_ENV) {
  currentEnvironmentVariables = {
    staging: { ...dbEnvVars },
  }
} else if (IS_PROD_ENV) {
  currentEnvironmentVariables = {
    production: { ...dbEnvVars },
  }
} else {
  currentEnvironmentVariables = {
    development: { ...dbEnvVars },
  }
}

module.exports = currentEnvironmentVariables
