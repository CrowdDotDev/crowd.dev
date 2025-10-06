from contextlib import asynccontextmanager
from typing import Any

import asyncpg
from asyncpg import Connection, Pool
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_fixed

from crowdgit.errors import InternalError
from crowdgit.settings import (
    CROWD_DB_DATABASE,
    CROWD_DB_PASSWORD,
    CROWD_DB_PORT,
    CROWD_DB_USERNAME,
    CROWD_DB_WRITE_HOST,
)

# Global connection pool
_pool: Pool | None = None


def get_db_config() -> dict[str, Any]:
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


@retry(
    stop=stop_after_attempt(5),
    wait=wait_fixed(1),
    reraise=True,
)
async def get_pool() -> Pool:
    """Get or create connection pool"""
    try:
        global _pool
        if _pool is None:
            config = get_db_config()
            _pool = await asyncpg.create_pool(**config)
            logger.info("Created database connection pool")
        return _pool
    except Exception as e:
        logger.error(f"Couldn't create db connection pool {e}")
        raise InternalError("Database error") from e


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
