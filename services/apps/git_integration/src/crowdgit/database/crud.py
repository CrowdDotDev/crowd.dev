from typing import Dict, Any, Optional
from .registry import fetchval, fetchrow


async def insert_repository(url: str, priority: int = 0) -> str:
    """Insert a new repository"""
    query = """
    INSERT INTO git.repositories (url, priority, state)
    VALUES ($1, $2, 'pending')
    RETURNING id
    """
    result = await fetchval(query, (url, priority))
    return str(result)


async def get_repository_by_url(url: str) -> Optional[Dict[str, Any]]:
    """Get repository by URL"""
    query = """
    SELECT id, url, state, priority, "lastProcessedAt", "createdAt", "updatedAt"
    FROM git.repositories
    WHERE url = $1 AND "deletedAt" IS NULL
    """
    result = await fetchrow(query, (url,))
    return dict(result) if result else None
