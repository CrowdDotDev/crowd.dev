from crowdgit.cm_maintainers_data.cm_database import query, execute
from crowdgit.cm_maintainers_data.scraper import MaintainerInfoItem
from slugify import slugify
import asyncio
from datetime import datetime
from crowdgit.logger import get_logger

logger = get_logger(__name__)


def make_role(title: str):
    title = title.lower()
    title = title.replace("repository", "").replace("active", "").replace("project", "").strip()
    return slugify(title)


async def compare_and_update_maintainers(
    repo_id: str, repo_url: str, maintainers: list[MaintainerInfoItem], change_date: datetime
):
    current_maintainers = await query(
        """
        SELECT mi.role, mi."originalRole", mi."repoUrl", mi."repoId", mi."identityId", mem.value as github_username
        FROM "maintainersInternal" mi
        JOIN "memberIdentities" mem ON mi."identityId" = mem.id
        WHERE mi."repoId" = $1 AND mem.platform = 'github' AND mem.type = 'username' and mem.verified = True
        """,
        (repo_id,),
    )

    current_maintainers_dict = {m["github_username"]: m for m in current_maintainers}
    new_maintainers_dict = {m.github_username: m for m in maintainers}

    for github_username, maintainer in new_maintainers_dict.items():
        if github_username == "unknown":
            continue
        elif github_username not in current_maintainers_dict:
            # New maintainer
            identity = await query(
                """
                SELECT id 
                FROM "memberIdentities" 
                WHERE platform = 'github' AND value = $1
                LIMIT 1
                """,
                (github_username,),
            )
            if identity:
                identity_id = identity[0]["id"]
                role = maintainer.normalized_title
                original_role = make_role(maintainer.title)
                await execute(
                    """
                    INSERT INTO "maintainersInternal" 
                    (role, "originalRole", "repoUrl", "repoId", "identityId", "startDate")
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    (role, original_role, repo_url, repo_id, identity_id, change_date),
                )
        else:
            # Existing maintainer
            current_maintainer = current_maintainers_dict[github_username]
            role = maintainer.normalized_title
            original_role = make_role(maintainer.title)
            if current_maintainer["role"] != role:
                # Role has changed
                await execute(
                    """
                    UPDATE "maintainersInternal"
                    SET "endDate" = $1,
                    "updatedAt" = NOW()
                    WHERE "repoId" = $2 AND "identityId" = $3 AND role = $4
                    """,
                    (
                        change_date,
                        repo_id,
                        current_maintainer["identityId"],
                        current_maintainer["role"],
                    ),
                )
                await execute(
                    """
                    INSERT INTO "maintainersInternal" 
                    (role, "originalRole", "repoUrl", "repoId", "identityId", "startDate")
                    VALUES ($1, $2, $3, $4, $5, $6)
                    """,
                    (
                        role,
                        original_role,
                        repo_url,
                        repo_id,
                        current_maintainer["identityId"],
                        change_date,
                    ),
                )

    for github_username, current_maintainer in current_maintainers_dict.items():
        if github_username not in new_maintainers_dict:
            # Maintainer no longer exists
            await execute(
                """
                UPDATE "maintainersInternal"
                SET "endDate" = $1,
                "updatedAt" = NOW()
                WHERE "repoId" = $2 AND "identityId" = $3 AND role = $4
                """,
                (
                    change_date,
                    repo_id,
                    current_maintainer["identityId"],
                    current_maintainer["role"],
                ),
            )


async def process_maintainers(repo_id: str, repo_url: str, maintainers: list[MaintainerInfoItem]):
    async def process_maintainer(maintainer: MaintainerInfoItem):
        logger.info(f"Processing maintainer: {maintainer.github_username}")
        role = maintainer.normalized_title
        original_role = make_role(maintainer.title)
        # Find the identity in the database
        github_username = maintainer.github_username
        if github_username == "unknown":
            return
        identity = await query(
            """
            SELECT id 
            FROM "memberIdentities" 
            WHERE platform = 'github' AND value = $1
            LIMIT 1
        """,
            (github_username,),
        )
        if identity:
            identity_id = identity[0]["id"]
            # Insert maintainer data
            await execute(
                """
                INSERT INTO "maintainersInternal" 
                (role, "originalRole", "repoUrl", "repoId", "identityId")
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT ("repoId", "identityId", "endDate", "startDate") DO UPDATE
                SET role = EXCLUDED.role, "originalRole" = EXCLUDED."originalRole", "updatedAt" = NOW()
            """,
                (role, original_role, repo_url, repo_id, identity_id),
            )
        else:
            logger.warning(f"Identity not found for GitHub user: {maintainer}")

    semaphore = asyncio.Semaphore(3)

    async def process_with_semaphore(maintainer: MaintainerInfoItem):
        async with semaphore:
            await process_maintainer(maintainer)

    await asyncio.gather(*[process_with_semaphore(maintainer) for maintainer in maintainers])
