from typing import Dict, Any, Optional
from .registry import fetchval, fetchrow
from crowdgit.models.repository import Repository
from .connection import get_db_connection
from crowdgit.enums import RepositoryPriority, RepositoryState
from loguru import logger
from crowdgit.errors import RepoLockingError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed
from crowdgit.settings import REPOSITORY_UPDATE_INTERVAL_HOURS


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
    SELECT id, url, state, priority, "lastProcessedAt", "lockedAt", "createdAt", "updatedAt"
    FROM git.repositories
    WHERE url = $1 AND "deletedAt" IS NULL
    """
    result = await fetchrow(query, (url,))
    return dict(result) if result else None


async def acquire_onboarding_repo() -> Repository | None:
    logger.info("Trying to acquire onboarding repo...")
    onboarding_repo_query = """
    UPDATE git.repositories
    SET "lockedAt" = NOW(),
        state = $1,
        "updatedAt" = NOW()
    WHERE id = (
        SELECT id
        FROM git.repositories
        WHERE state = $2
            AND "lockedAt" IS NULL
            AND "deletedAt" IS NULL
        ORDER BY priority ASC, "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, url, state, priority, "lastProcessedAt", "lastProcessedCommit", "lockedAt", "createdAt", "updatedAt"
    """
    return await acquire_repository(
        onboarding_repo_query, (RepositoryState.PROCESSING, RepositoryState.PENDING)
    )


@retry(
    retry=retry_if_exception_type(RepoLockingError),
    stop=stop_after_attempt(3),
    wait=wait_fixed(1),
    reraise=True,
)
async def acquire_repository(query: str, params: tuple = None) -> Repository | None:
    async with get_db_connection() as conn:
        try:
            async with conn.transaction():
                result = await conn.fetchrow(query, *params)
                if result:
                    repo = Repository.from_db(dict(result))
                    logger.info(f"Acquired repository: {repo.url}")
                    return repo
                # logger.info(
                #     "No repository is available for processing based on the filtering rules"
                # )
                return None
        except Exception as e:
            logger.error(f"failed to acquire repository with error: {e}. Retrying...")
            raise RepoLockingError()


async def acquire_recurrent_repo() -> Optional[Repository]:
    """Acquire a regular (non-onboarding) repository, that were not processed in the last x hours (REPOSITORY_UPDATE_INTERVAL_HOURS)"""
    logger.info("Trying to acquire non-onboarding repository...")
    # TODO: review ordering filters (priority, createdAt, lastProcessedAt)
    recurrent_repo_query = """
    UPDATE git.repositories
    SET "lockedAt" = NOW(),
        state = $1,
        "updatedAt" = NOW()
    WHERE id = (
        SELECT id
        FROM git.repositories
        WHERE NOT (state = ANY($2))
            AND "lockedAt" IS NULL
            AND "deletedAt" IS NULL
            AND "lastProcessedAt" < NOW() - INTERVAL '1 hour' * $3
        ORDER BY priority ASC, "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, url, state, priority, "lastProcessedAt", "lastProcessedCommit", "lockedAt", "createdAt", "updatedAt"
    """
    states_to_exclude = (RepositoryState.PENDING, RepositoryState.PROCESSING)
    return await acquire_repository(
        recurrent_repo_query,
        (RepositoryState.PROCESSING, states_to_exclude, REPOSITORY_UPDATE_INTERVAL_HOURS),
    )


async def acquire_repo_for_processing() -> Optional[Repository]:
    # prioritizing onboarding repositories
    # TODO: document priority logic and values(0, 1, 2)
    repo_to_process = await acquire_onboarding_repo()
    if not repo_to_process:
        # Fallback to non-onboarding repos
        repo_to_process = await acquire_recurrent_repo()
    return repo_to_process


async def release_repo(repo_id: str):
    """
    Release repository lock (lockedAt) after processing
    """
    query = """
    UPDATE git.repositories
        SET "lockedAt" = NULL,
        "updatedAt" = NOW()
    WHERE id = $1
    """
    result = await fetchval(query, (repo_id,))
    return str(result)


async def update_last_processed_commit(repo_id: str, commit_hash: str):
    """
    Release repository lock (lockedAt) after processing
    """
    query = """
    UPDATE git.repositories
        SET "lastProcessedCommit" = $1,
        "updatedAt" = NOW()
    WHERE id = $2
    """
    result = await fetchval(query, (commit_hash, repo_id))
    return str(result)


async def mark_repo_as_processed(repo_id: str, repo_state: RepositoryState):
    query = """
    UPDATE git.repositories
        SET "state" = $2,
        "lastProcessedAt" = NOW(),
        "updatedAt" = NOW(),
        "priority" = $3
    WHERE id = $1
    """
    result = await fetchval(query, (repo_id, repo_state, RepositoryPriority.NORMAL))
    return str(result)
