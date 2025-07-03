import asyncpg
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from crowdgit.logger import get_logger

logger = get_logger(__name__)

load_dotenv()


async def get_db_connection(is_read_operation: bool = True):
    db_params = {
        "database": os.getenv("DB_DATABASE"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT_READ") if is_read_operation else os.getenv("DB_PORT_WRITE"),
    }
    required_env_vars = [
        "DB_DATABASE",
        "DB_USER",
        "DB_PASSWORD",
        "DB_HOST",
        "DB_PORT_READ",
        "DB_PORT_WRITE",
    ]
    missing_env_vars = [var for var in required_env_vars if os.getenv(var) is None]
    if missing_env_vars:
        raise ValueError(
            f"The following environment variables are not set: {', '.join(missing_env_vars)}"
        )
    return await asyncpg.connect(**db_params)


async def query(sql: str, params: tuple = None) -> List[Dict[str, Any]]:
    try:
        conn = await get_db_connection(is_read_operation=True)
        try:
            results = await conn.fetch(sql, *params) if params else await conn.fetch(sql)
            return [dict(row) for row in results]
        finally:
            await conn.close()
    except Exception as error:
        logger.error(f"Error executing query: {error}")
        raise


async def execute(sql: str, params: tuple = None) -> None:
    try:
        conn = await get_db_connection(is_read_operation=False)
        try:
            await conn.execute(sql, *params) if params else await conn.execute(sql)
        finally:
            await conn.close()
    except Exception as error:
        logger.error(f"Error executing query: {error}")
        raise
