import { Pool } from 'pg';
import { Config } from "./config";

let pool: Pool | null = null;

function getPool(config: Config): Pool {
  // If the pool is already created, return it
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.PostgresHost,
    port: config.PostgresPort,
    database: config.PostgresDBName,
    user: config.PostgresUsername,
    password: config.PostgresPassword,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxLifetimeSeconds: 60,
    ssl: {
      rejectUnauthorized: false
    },
  });

  return pool;
}

export async function fetchRepositoryUrls(batchSize: number, config: Config): Promise<string[]> {
  // Ensure that batchSize is a positive integer
  if (batchSize <= 0) {
    throw new Error('Invalid batch size. Please provide a positive integer.');
  }

  const client = getPool(config);
  
  try {
    const result = await client.query(
      `SELECT repository FROM "segmentRepositories"
       WHERE last_archived_check IS NULL OR last_archived_check < NOW() - INTERVAL \'5 days\'
       ORDER BY last_archived_check
       LIMIT $1`,
      [batchSize]
    );
    
    return result.rows.map(row => row.repository);
  } catch (error) {
    console.error('Error fetching repository URLs:', error);
    throw error;
  }
}

export async function updateRepositoryStatus(
  repository: string,
  isArchived: boolean,
  config: Config
): Promise<void> {
  const client = getPool(config);
  
  try {
    await client.query(
      `UPDATE "segmentRepositories" 
       SET archived = $1, excluded = $2, last_archived_check = NOW(), updatedAt = NOW()
       WHERE repository = $3`,
      [isArchived, isArchived, repository]
    );
  } catch (error) {
    console.error(`Error updating repository status for ${repository}:`, error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
