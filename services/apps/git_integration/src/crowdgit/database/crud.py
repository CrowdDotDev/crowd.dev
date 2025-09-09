from typing import Dict, Any, Optional, List
from .registry import fetchval, fetchrow, executemany, execute, query
from crowdgit.models.repository import Repository
from crowdgit.models.service_execution import ServiceExecution
from .connection import get_db_connection
from crowdgit.enums import RepositoryPriority, RepositoryState
from loguru import logger
from crowdgit.errors import RepoLockingError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed
from crowdgit.settings import REPOSITORY_UPDATE_INTERVAL_HOURS
from datetime import datetime


async def insert_repository(url: str, priority: int = 0) -> str:
    """Insert a new repository"""
    sql_query = """
    INSERT INTO git.repositories (url, priority, state)
    VALUES ($1, $2, 'pending')
    RETURNING id
    """
    result = await fetchval(sql_query, (url, priority))
    return str(result)


async def get_repository_by_url(url: str) -> Optional[Dict[str, Any]]:
    """Get repository by URL"""
    sql_query = """
    SELECT id, url, state, priority, "lastProcessedAt", "lockedAt", "createdAt", "updatedAt", "maintainerFile"
    FROM git.repositories
    WHERE url = $1 AND "deletedAt" IS NULL
    """
    result = await fetchrow(sql_query, (url,))
    return dict(result) if result else None


async def acquire_onboarding_repo() -> Repository | None:
    onboarding_repo_sql_query = """
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
    RETURNING id, url, state, priority, "lastProcessedAt", "lastProcessedCommit", "lockedAt", "createdAt", "updatedAt", "segmentId", "integrationId", "maintainerFile", "lastMaintainerRunAt"
    """
    return await acquire_repository(
        onboarding_repo_sql_query, (RepositoryState.PROCESSING, RepositoryState.PENDING)
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
    recurrent_repo_sql_query = """
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
        ORDER BY priority ASC, "lastProcessedAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING id, url, state, priority, "lastProcessedAt", "lastProcessedCommit", "lockedAt", "createdAt", "updatedAt", "segmentId", "integrationId", "maintainerFile", "lastMaintainerRunAt"
    """
    states_to_exclude = (RepositoryState.PENDING, RepositoryState.PROCESSING)
    return await acquire_repository(
        recurrent_repo_sql_query,
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
    sql_query = """
    UPDATE git.repositories
        SET "lockedAt" = NULL,
        "updatedAt" = NOW()
    WHERE id = $1
    """
    result = await execute(sql_query, (repo_id,))
    return str(result)


async def update_last_processed_commit(repo_id: str, commit_hash: str):
    """
    Release repository lock (lockedAt) after processing
    """
    sql_query = """
    UPDATE git.repositories
        SET "lastProcessedCommit" = $1,
        "updatedAt" = NOW()
    WHERE id = $2
    """
    result = await execute(sql_query, (commit_hash, repo_id))
    return str(result)


async def mark_repo_as_processed(repo_id: str, repo_state: RepositoryState):
    sql_query = """
    UPDATE git.repositories
        SET "state" = $2,
        "lastProcessedAt" = NOW(),
        "updatedAt" = NOW(),
        "priority" = $3
    WHERE id = $1
    """
    result = await execute(sql_query, (repo_id, repo_state, RepositoryPriority.NORMAL))
    return str(result)


async def batch_insert_activities(records: List[tuple], batch_size=100):
    sql_query = """
    INSERT INTO integration.results(id, state, data, "tenantId", "integrationId")
    values($1, $2, $3, $4, $5)
    """
    logger.info(f"Saving {len(records)} activity into integration.results")
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        await executemany(sql_query, batch)
    logger.info("activities saved into integration.results")


async def find_github_identity(github_username: str):
    sql_query = """
    SELECT id
        FROM "memberIdentities"
    WHERE
        platform = 'github'
        AND value = $1
    LIMIT 1
    """
    result = await fetchval(
        sql_query,
        (github_username,),
    )
    return result


async def upsert_maintainer(
    repo_id: str,
    identity_id: str,
    repo_url: str,
    role: str,
    original_role: str,
    start_date: datetime | None = None,
):
    sql_query = """
        INSERT INTO "maintainersInternal" 
        ("role", "originalRole", "repoUrl", "repoId", "identityId", "startDate", "endDate")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("repoId", "identityId", "startDate", "endDate") DO UPDATE
        SET role = EXCLUDED.role, "originalRole" = EXCLUDED."originalRole", "updatedAt" = NOW()
    """
    await execute(
        sql_query,
        (role, original_role, repo_url, repo_id, identity_id, start_date, None),
    )


async def update_maintainer_run(repo_id: str, maintainer_file: str):
    # TODO: deprecate githubRepos once all repos migrated to git.repositories
    # Update githubRepos table
    github_repos_sql_query = """
        UPDATE "githubRepos"
            SET "maintainerFile" = $1,
                "lastMaintainerRunAt" = NOW()
        WHERE id = $2
        """
    await execute(
        github_repos_sql_query,
        (maintainer_file, repo_id),
    )

    # Update git.repositories table
    git_repos_sql_query = """
        UPDATE git.repositories
            SET "maintainerFile" = $1,
                "lastMaintainerRunAt" = NOW(),
                "updatedAt" = NOW()
        WHERE id = $2
        """
    await execute(
        git_repos_sql_query,
        (maintainer_file, repo_id),
    )


async def get_maintainers_for_repo(repo_id: str):
    maintainers_sql_query = """
        SELECT mi.role, mi."originalRole", mi."repoUrl", mi."repoId", mi."identityId", mem.value as github_username
            FROM "maintainersInternal" mi
            JOIN "memberIdentities" mem ON mi."identityId" = mem.id
        WHERE mi."repoId" = $1 AND mem.platform = 'github' AND mem.type = 'username' and mem.verified = True
        """
    return await query(
        maintainers_sql_query,
        (repo_id,),
    )


async def set_maintainer_end_date(
    repo_id: str, identity_id: str, role: str, change_date: datetime
):
    update_end_date_query = """
        UPDATE "maintainersInternal"
        SET "endDate" = $1,
            "updatedAt" = NOW()
        WHERE "repoId" = $2 AND "identityId" = $3 AND role = $4
    """
    await execute(
        update_end_date_query,
        (
            change_date,
            repo_id,
            identity_id,
            role,
        ),
    )


async def save_service_execution(service_execution: ServiceExecution) -> None:
    """
    Save service execution record to database.
    """
    try:
        sql_query = """
        INSERT INTO git."serviceExecutions" (
            "repoId", "operationType", "status", "errorCode", 
            "errorMessage", "executionTimeSec"
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        """

        db_data = service_execution.to_db_dict()
        await execute(
            sql_query,
            (
                db_data["repoId"],
                db_data["operationType"],
                db_data["status"],
                db_data["errorCode"],
                db_data["errorMessage"],
                db_data["executionTimeSec"],
            ),
        )
        logger.debug(
            f"Successfully saved service execution: {service_execution.operation_type} for repo {service_execution.repo_id}"
        )

    except Exception as e:
        logger.error(
            f"Failed to save service execution record: operation={service_execution.operation_type}, "
            f"repo_id={service_execution.repo_id}, status={service_execution.status.value}, "
            f"error: {e}"
        )
        # Do not re-raise - we don't want metrics saving to disrupt main operations
