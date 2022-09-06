require('dotenv').config()

const dbEnvVars = {
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_DATABASE,
  host: process.env.DATABASE_HOST_WRITE,
  dialect: process.env.DATABASE_DIALECT,
  logging: true,
}

let currentEnvironmentVariables = {}

if (process.env.NODE_ENV === 'test') {
  currentEnvironmentVariables = {
    test: { ...dbEnvVars },
  }
} else if (process.env.NODE_ENV === 'staging') {
  currentEnvironmentVariables = {
    staging: { ...dbEnvVars },
  }
} else if (process.env.NODE_ENV === 'production') {
  currentEnvironmentVariables = {
    production: { ...dbEnvVars },
  }
} else {
  currentEnvironmentVariables = {
    development: { ...dbEnvVars },
  }
}

module.exports = currentEnvironmentVariables
