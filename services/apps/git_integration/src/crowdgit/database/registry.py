from typing import List, Dict, Any, Optional
from .connection import get_db_connection
from loguru import logger
from crowdgit.errors import InternalError


async def query(sql: str, params: tuple = None) -> List[Dict[str, Any]]:
    """Execute query with connection pooling"""
    try:
        async with get_db_connection() as conn:
            results = await conn.fetch(sql, *params) if params else await conn.fetch(sql)
            return [dict(row) for row in results]
    except Exception as error:
        logger.error("Database query failed - SQL: {}, Params: {}, Error: {}", sql, params, error)
        raise InternalError("Database query failed")


async def execute(sql: str, params: tuple = None) -> str:
    """Execute write query with connection pooling"""
    try:
        async with get_db_connection() as conn:
            result = await conn.execute(sql, *params) if params else await conn.execute(sql)
            return result
    except Exception as error:
        logger.error(
            "Database write operation failed - SQL: {}, Params: {}, Error: {}", sql, params, error
        )
        raise InternalError("Database execute operation failed")


async def fetchval(sql: str, params: tuple = None) -> Any:
    """Execute query and return single value"""
    try:
        async with get_db_connection() as conn:
            result = await conn.fetchval(sql, *params) if params else await conn.fetchval(sql)
            return result
    except Exception as error:
        logger.error(
            "Database fetchval failed - SQL: {}, Params: {}, Error: {}", sql, params, error
        )
        raise InternalError("Database fetchval failed")


async def fetchrow(sql: str, params: tuple = None) -> Optional[Dict[str, Any]]:
    """Execute query and return single row"""
    try:
        async with get_db_connection() as conn:
            result = await conn.fetchrow(sql, *params) if params else await conn.fetchrow(sql)
            return dict(result) if result else None
    except Exception as error:
        logger.error(
            "Database fetchrow failed - SQL: {}, Params: {}, Error: {}", sql, params, error
        )
        raise InternalError("Database fetchrow failed")
