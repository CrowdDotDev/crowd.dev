import dotenv from 'dotenv'

export interface Config {
  GithubToken: string
  GitlabToken: string

  PostgresHost: string
  PostgresPort: number
  PostgresDBName: string
  PostgresUsername: string
  PostgresPassword: string
  PostgresUrl: string

  RedisHost: string
  RedisPort: number
  RedisUsername: string
  RedisPassword: string
  RedisDB: number // This is the Redis database index, not a URL.
  RedisUrl: string

  BatchSize: number
  BatchDelayMs: number
}

// These environment variables are required for the application to function correctly. The remaining ones should have
// sensible defaults.
const requiredEnvVars = [
  'ARCHIVED_REPOSITORIES_CHECKER_GITHUB_TOKEN',
  'ARCHIVED_REPOSITORIES_CHECKER_GITLAB_TOKEN',

  'CROWD_DB_WRITE_HOST',
  'CROWD_DB_READ_HOST',
  'CROWD_DB_PORT',
  'CROWD_DB_USERNAME',
  'CROWD_DB_PASSWORD',
  'CROWD_DB_DATABASE',

  'CROWD_REDIS_USERNAME',
  'CROWD_REDIS_PASSWORD',
  'CROWD_REDIS_HOST',
  'CROWD_REDIS_PORT',
  'ARCHIVED_REPOSITORIES_CHECKER_REDIS_DB',
]

const defaults = {
  ARCHIVED_REPOSITORIES_CHECKER_BATCH_SIZE: 100,
  ARCHIVED_REPOSITORIES_CHECKER_BATCH_DELAY_MS: 5000,
}

/**
 * Loads configuration from environment variables or a .env file.
 * Throws an error if any required environment variable is missing.
 * This way we can more easily test the code by mocking the environment variables, and also replace the way
 * we load the configuration in the future if needed (e.g. using a secrets store).
 */
export function getConfig(): Config {
  dotenv.config()

  // Check if all required environment variables are set
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  // Helper that returns a validated environment variable as a string.
  // This avoids using the non-null assertion operator (!) which is forbidden by our ESLint rules.
  const getEnv = (name: string): string => {
    const val = process.env[name]
    if (val === undefined) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    return val
  }

  // Assemble database connection URL strings for convenience
  const postgresURL = `postgresql://${getEnv('CROWD_DB_USERNAME')}:${getEnv('CROWD_DB_PASSWORD')}@${getEnv('CROWD_DB_WRITE_HOST')}:${getEnv('CROWD_DB_PORT')}/${getEnv('CROWD_DB_DATABASE')}?ssl=true`
  const redisURL = `redis://${getEnv('CROWD_REDIS_USERNAME')}:${getEnv('CROWD_REDIS_PASSWORD')}@${getEnv('CROWD_REDIS_HOST')}:${getEnv('CROWD_REDIS_PORT')}/${getEnv('ARCHIVED_REPOSITORIES_CHECKER_REDIS_DB')}`

  return {
    GithubToken: getEnv('ARCHIVED_REPOSITORIES_CHECKER_GITHUB_TOKEN'),
    GitlabToken: getEnv('ARCHIVED_REPOSITORIES_CHECKER_GITLAB_TOKEN'),

    PostgresHost: getEnv('CROWD_DB_WRITE_HOST'),
    PostgresPort: parseInt(getEnv('CROWD_DB_PORT'), 10),
    PostgresDBName: getEnv('CROWD_DB_DATABASE'),
    PostgresUsername: getEnv('CROWD_DB_USERNAME'),
    PostgresPassword: getEnv('CROWD_DB_PASSWORD'),
    PostgresUrl: postgresURL,

    RedisHost: getEnv('CROWD_REDIS_HOST'),
    RedisPort: parseInt(getEnv('CROWD_REDIS_PORT'), 10),
    RedisUsername: getEnv('CROWD_REDIS_USERNAME'),
    RedisPassword: getEnv('CROWD_REDIS_PASSWORD'),
    RedisDB: parseInt(getEnv('ARCHIVED_REPOSITORIES_CHECKER_REDIS_DB'), 10),
    RedisUrl: redisURL,

    BatchSize:
      parseInt(getEnv('ARCHIVED_REPOSITORIES_CHECKER_BATCH_SIZE'), 10) ||
      defaults.ARCHIVED_REPOSITORIES_CHECKER_BATCH_SIZE,
    BatchDelayMs:
      parseInt(getEnv('ARCHIVED_REPOSITORIES_CHECKER_BATCH_DELAY_MS'), 10) ||
      defaults.ARCHIVED_REPOSITORIES_CHECKER_BATCH_DELAY_MS,
  }
}
