from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

import asyncpg
from asyncpg import Pool, Connection
from loguru import logger

from crowdgit.settings import (
    CROWD_DB_WRITE_HOST,
    CROWD_DB_PORT,
    CROWD_DB_USERNAME,
    CROWD_DB_PASSWORD,
    CROWD_DB_DATABASE,
)

# Global connection pool
_pool: Optional[Pool] = None


def get_db_config() -> Dict[str, Any]:
    """Get database configuration"""
    return {
        "database": CROWD_DB_DATABASE,
        "user": CROWD_DB_USERNAME,
        "password": CROWD_DB_PASSWORD,
        "host": CROWD_DB_WRITE_HOST,
        "port": CROWD_DB_PORT,
        "min_size": 5,
        "max_size": 20,
        "command_timeout": 120,
        "server_settings": {"application_name": "git_integration"},
    }


async def get_pool() -> Pool:
    """Get or create connection pool"""
    global _pool
    if _pool is None:
        config = get_db_config()
        _pool = await asyncpg.create_pool(**config)
        logger.info("Created database connection pool")
    return _pool


@asynccontextmanager
async def get_db_connection() -> Connection:
    """Get database connection from pool"""
    pool = await get_pool()
    async with pool.acquire() as connection:
        try:
            yield connection
        except Exception as exc:
            logger.exception("Database error occurred: {}", exc)
            raise


async def close_pool():
    """Close connection pool"""
    global _pool

    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Closed database connection pool")
