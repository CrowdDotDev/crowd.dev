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
  RedisUsername?: string;
  RedisPassword: string;
  RedisUrl: string;
  BatchSize: number;
  BatchDelayMs: number;
}

const requiredEnvVars = [
  'GITHUB_TOKEN',
  'GITLAB_TOKEN',
  'CROWD_DB_WRITE_HOST',
  'CROWD_DB_READ_HOST',
  'CROWD_DB_PORT',
  'CROWD_DB_USERNAME',
  'CROWD_DB_PASSWORD',
  'CROWD_DB_DATABASE',
  // 'CROWD_REDIS_USERNAME', // We use the classic Redis authentication, in which a username is not used.
  'CROWD_REDIS_PASSWORD',
  'CROWD_REDIS_HOST',
  'CROWD_REDIS_PORT',
];


/**
 * Loads configuration from environment variables or a .env file.
 * Throws an error if any required environment variable is missing.
 * This way we can more easily test the code by mocking the environment variables, and also replace the way
 * we load the configuration in the future if needed (e.g. using a secrets store).
 */
export function getConfig(): Config {
  dotenv.config();

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Assemble database connection URL strings for convenience
  const postgresURL = `postgresql://${process.env.CROWD_DB_USERNAME}:${process.env.CROWD_DB_PASSWORD}@${process.env.CROWD_DB_WRITE_HOST}:${process.env.CROWD_DB_PORT}/${process.env.CROWD_DB_DATABASE}`;
  const redisURL = `redis://${process.env.CROWD_REDIS_USERNAME}:${process.env.CROWD_REDIS_PASSWORD}@${process.env.CROWD_REDIS_HOST}:${process.env.CROWD_REDIS_PORT}`;

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
    RedisUsername: process.env.CROWD_REDIS_USERNAME || undefined,
    RedisPassword: process.env.CROWD_REDIS_PASSWORD!,
    RedisUrl: redisURL,
    BatchSize: parseInt(process.env.BATCH_SIZE!, 10) || 100,
    BatchDelayMs: parseInt(process.env.BATCH_DELAY_MS!, 10) || 5000,
  };
}
