import { IS_TEST_ENV, IS_STAGING_ENV, IS_PROD_ENV, DB_CONFIG } from '../config'

const dbEnvVars = {
  username: DB_CONFIG.username,
  password: DB_CONFIG.password,
  database: DB_CONFIG.database,
  host: DB_CONFIG.writeHost,
  dialect: DB_CONFIG.dialect,
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

const vars = currentEnvironmentVariables
export default vars
