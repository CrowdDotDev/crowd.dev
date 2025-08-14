import dotenv from 'dotenv';

export interface Config {
  GithubToken: string;
  GitlabToken: string;
  PostgresHost: string;
  PostgresPort: number;
  PostgresDBName: string;
  PostgresUsername: string;
  PostgresPassword: string;
  PostgresUrl: string;
  RedisHost: string;
  RedisPort: number;
  RedisUsername: string;
  RedisPassword: string;
  RedisDB: number; // This is the Redis database index, not a URL.
  RedisUrl: string;
  BatchSize: number;
  BatchDelayMs: number;
}

// These environment variables are required for the application to function correctly. The remaining ones should have
// sensible defaults.
const requiredEnvVars = [
  'GITHUB_TOKEN',
  'GITLAB_TOKEN',
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
  'REDIS_DB',
];

const defaults = {
  BATCH_SIZE: '100',
  BATCH_DELAY_MS: '5000',
}


/**
 * Loads configuration from environment variables or a .env file.
 * Throws an error if any required environment variable is missing.
 * This way we can more easily test the code by mocking the environment variables, and also replace the way
 * we load the configuration in the future if needed (e.g. using a secrets store).
 */
export function getConfig(): Config {
  dotenv.config();

  // Check if all required environment variables are set
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Assemble database connection URL strings for convenience
  const postgresURL = `postgresql://${process.env.CROWD_DB_USERNAME}:${process.env.CROWD_DB_PASSWORD}@${process.env.CROWD_DB_WRITE_HOST}:${process.env.CROWD_DB_PORT}/${process.env.CROWD_DB_DATABASE}`;
  const redisURL = `redis://${process.env.CROWD_REDIS_USERNAME}:${process.env.CROWD_REDIS_PASSWORD}@${process.env.CROWD_REDIS_HOST}:${process.env.CROWD_REDIS_PORT}/${process.env.REDIS_DB}`;

  return {
    GithubToken: process.env.GITHUB_TOKEN!,
    GitlabToken: process.env.GITLAB_TOKEN!,

    PostgresHost: process.env.CROWD_DB_WRITE_HOST!,
    PostgresPort: parseInt(process.env.CROWD_DB_PORT!, 10),
    PostgresDBName: process.env.CROWD_DB_DATABASE!,
    PostgresUsername: process.env.CROWD_DB_USERNAME!,
    PostgresPassword: process.env.CROWD_DB_PASSWORD!,
    PostgresUrl: postgresURL,

    RedisHost: process.env.CROWD_REDIS_HOST!,
    RedisPort: parseInt(process.env.CROWD_REDIS_PORT!, 10),
    RedisUsername: process.env.CROWD_REDIS_USERNAME!,
    RedisPassword: process.env.CROWD_REDIS_PASSWORD!,
    RedisDB: parseInt(process.env.REDIS_DB!, 10),
    RedisUrl: redisURL,

    BatchSize: parseInt(process.env.BATCH_SIZE!, 10) || defaults.BATCH_SIZE,
    BatchDelayMs: parseInt(process.env.BATCH_DELAY_MS!, 10) || defaults.BATCH_DELAY_MS,
  };
}
