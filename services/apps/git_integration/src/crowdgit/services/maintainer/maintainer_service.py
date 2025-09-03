from typing import Dict, Any
from loguru import logger
from crowdgit.services.utils import parse_repo_url
from crowdgit.services.base.base_service import BaseService
from crowdgit.errors import MaintainerFileNotFoundError, MaintanerAnalysisError, CrowdGitError
from crowdgit.settings import MAINTAINER_RETRY_INTERVAL_DAYS
from crowdgit.models.service_execution import ServiceExecution
from crowdgit.enums import ExecutionStatus, ErrorCode, OperationType
from crowdgit.database.crud import save_service_execution
import os
import base64
import asyncio
import aiofiles
import aiofiles.os
from crowdgit.models.maintainer_info import (
    MaintainerFile,
    MaintainerInfo,
    MaintainerResult,
    MaintainerInfoItem,
    AggregatedMaintainerInfo,
    AggregatedMaintainerInfoItems,
)
from crowdgit.services.maintainer.bedrock import invoke_bedrock
from slugify import slugify
from crowdgit.database.crud import (
    find_github_identity,
    upsert_maintainer,
    update_maintainer_run,
    get_maintainers_for_repo,
    set_maintainer_end_date,
)
from datetime import datetime, timezone, time
import time as time_module
from decimal import Decimal


class MaintainerService(BaseService):
    """Service for processing maintainer data"""

    MAX_CHUNK_SIZE = 5000
    # List of common maintainer file names
    MAINTAINER_FILES = [
        "MAINTAINERS",
        "MAINTAINERS.md",
        "MAINTAINER.md",
        "CODEOWNERS.md",
        "CONTRIBUTORS",
        "CONTRIBUTORS.md",
        "docs/MAINTAINERS.md",
        "OWNERS",
        "CODEOWNERS",
        ".github/MAINTAINERS.md",
        ".github/CONTRIBUTORS.md",
    ]

    def make_role(self, title: str):
        title = title.lower()
        title = (
            title.replace("repository", "").replace("active", "").replace("project", "").strip()
        )
        return slugify(title)

    async def insert_new_maintainers(
        self, repo_url: str, repo_id: str, maintainers: list[MaintainerInfoItem]
    ):
        async def process_maintainer(maintainer: MaintainerInfoItem):
            self.logger.info(f"Processing maintainer: {maintainer.github_username}")
            role = maintainer.normalized_title
            original_role = self.make_role(maintainer.title)
            # Find the identity in the database
            github_username = maintainer.github_username
            if github_username == "unknown":
                self.logger.warning("github username with value 'unknown' aborting")
                return
            identity_id = await find_github_identity(github_username)
            self.logger.debug(
                f"Found identity_id for {github_username}: {identity_id} (type: {type(identity_id)})"
            )
            if identity_id:
                await upsert_maintainer(repo_id, identity_id, repo_url, role, original_role)
                self.logger.info(
                    f"Successfully upserted maintainer {github_username} with identity_id {identity_id}"
                )
            else:
                self.logger.warning(f"Identity not found for GitHub user: {maintainer}")

        semaphore = asyncio.Semaphore(3)

        async def process_with_semaphore(maintainer: MaintainerInfoItem):
            async with semaphore:
                await process_maintainer(maintainer)

        await asyncio.gather(*[process_with_semaphore(maintainer) for maintainer in maintainers])

    async def compare_and_update_maintainers(
        self,
        repo_id: str,
        repo_url: str,
        maintainers: list[MaintainerInfoItem],
        change_date: datetime,
    ):
        self.logger.info(f"Comparing and updating maintainers for repo: {repo_id}")
        current_maintainers = await get_maintainers_for_repo(repo_id)
        current_maintainers_dict = {m["github_username"]: m for m in current_maintainers}
        new_maintainers_dict = {m.github_username: m for m in maintainers}

        for github_username, maintainer in new_maintainers_dict.items():
            role = maintainer.normalized_title
            original_role = self.make_role(maintainer.title)
            if github_username == "unknown":
                self.logger.warning(
                    f"Skipping unkown github_username with title {maintainer.title}"
                )
                continue
            elif github_username not in current_maintainers_dict:
                # New maintainer
                identity_id = await find_github_identity(github_username)
                self.logger.info(f"Found new maintainer {github_username} to be inserted")
                if identity_id:
                    await upsert_maintainer(
                        repo_id, identity_id, repo_url, role, original_role, start_date=change_date
                    )
                    self.logger.info(
                        f"Successfully inserted new maintainer {github_username} with identity_id {identity_id}"
                    )
                else:
                    # will happend for new users if their identity isn't created yet but should fixed on the next iteration
                    self.logger.warning(f"Identity not found for username: {github_username}")
            else:
                # Existing maintainer
                current_maintainer = current_maintainers_dict[github_username]
                if current_maintainer["role"] != role:
                    # Role has changed: we update maintainer
                    self.logger.info(
                        f"Role changed from {current_maintainer['role']} to {role} for maintainer {current_maintainer['identityId']}"
                    )
                    await upsert_maintainer(
                        repo_id,
                        current_maintainer["identityId"],
                        repo_url,
                        role,
                        original_role,
                        change_date,
                    )

        for github_username, current_maintainer in current_maintainers_dict.items():
            if github_username not in new_maintainers_dict:
                self.logger.info(
                    f"Maintainer {github_username} with identity {current_maintainer['identityId']} no longer exists, updating its endDate..."
                )
                await set_maintainer_end_date(
                    repo_id,
                    current_maintainer["identityId"],
                    current_maintainer["role"],
                    change_date,
                )

    async def save_maintainers(
        self,
        repo_id: str,
        repo_url: str,
        maintainers: list[MaintainerInfoItem],
        last_maintainer_run_at: datetime | None,
    ):
        """
        add/update maintainers in database
        """
        if not last_maintainer_run_at:
            # 1st time processing maintainer for this repo
            self.logger.info(f"1st time processing maintainers for repo {repo_id}")
            return await self.insert_new_maintainers(repo_url, repo_id, maintainers)
        self.logger.info(f"Updating maintainers for repo {repo_id}")
        # start/end Dates (change_date) is set to the day when detected the change which not very accurate, but acceptable for now
        today_midnight = datetime.combine(datetime.now(timezone.utc).date(), time.min)
        await self.compare_and_update_maintainers(
            repo_id, repo_url, maintainers, change_date=today_midnight
        )

    async def analyze_file_content(self, content: str):
        instructions = (
            "Analyze the following content from a GitHub repository file and extract maintainer information.",
            "The information should include GitHub usernames, names, and their titles or roles if available.",
            "If GitHub usernames are not explicitly mentioned, try to infer them from the names or any links provided.",
            "Present the information as a list of JSON objects.",
            "Each JSON object should have 'github_username', 'name', 'title' and 'normalized_title' fields.",
            "The title field should be a string that describes the maintainer's role or title,",
            "it should have a maximum of two words,",
            "and it should not contain words that do not add information, like 'repository', 'active', or 'project'.",
            "The title has to be related to ownershop, maintainership, review, governance, or similar. It cannot be Software Engineer, for example.",
            "The 'normalized_title' field should be either maintainer or contributor, nothing else.",
            "Select the most appropriate 'normalized_title for each maintainer given all the info.",
            "If a GitHub username can't be determined, use 'unknown' as the value.",
            "If you canot find any maintainer information, return {error: 'not_found'}",
            "If the content is not talking about a person, rather a group or team (for example config.yaml @LFDT-Hiero/lf-staff), return {error: 'not_found'}",
            "Here is the content to analyze:",
            "{CONTENT}."
            "Present the information as a list of JSON object in the following format:{info: <list of maintainer info>}, or {error: 'not_found'}",
            "The output should be a valid JSON array, directly parseable by Python.",
        )

        if len(content) > self.MAX_CHUNK_SIZE:
            self.logger.info(
                "Maintainers file content exceeded max chunk size, splitting into chuniks"
            )
            chunks = []
            while content:
                split_index = content.rfind("\n", 0, self.MAX_CHUNK_SIZE)
                if split_index == -1:
                    split_index = self.MAX_CHUNK_SIZE
                chunks.append(content[:split_index])
                content = content[split_index:].lstrip()

            aggregated_info = AggregatedMaintainerInfo(
                output=AggregatedMaintainerInfoItems(info=[]), cost=0
            )
            for i, chunk in enumerate(chunks, 1):
                self.logger.info(f"Processing maintainers chunk {i}")
                chunk_info = await invoke_bedrock(
                    instructions, pydantic_model=MaintainerInfo, replacements={"CONTENT": chunk}
                )
                if chunk_info.output.info is not None:
                    aggregated_info.output.info.extend(chunk_info.output.info)
                aggregated_info.cost += chunk_info.cost
            maintainer_info = aggregated_info
        else:
            maintainer_info = await invoke_bedrock(
                instructions, pydantic_model=MaintainerInfo, replacements={"CONTENT": content}
            )
        self.logger.info("Maintainers file content analyzed by AI")
        self.logger.info(f"Maintainers response: {maintainer_info}")
        if maintainer_info.output.info is not None:
            return AggregatedMaintainerInfo(
                output=AggregatedMaintainerInfoItems(info=maintainer_info.output.info),
                cost=maintainer_info.cost,
            )
        elif maintainer_info.output.error == "not_found":
            raise MaintanerAnalysisError(ai_cost=maintainer_info.cost)
        else:
            self.logger.error(
                f"Expected a list of maintainer info or an error message, got: {str(maintainer_info)}"
            )
            raise MaintanerAnalysisError(
                error_message="Unexpected response from AI for Maintainers analysis",
                ai_cost=maintainer_info.cost,
            )

    async def find_maintainer_file_with_ai(self, file_names):
        self.logger.info("Using AI to find maintainer files...")
        instructions = (
            "You are a helpful assistant.",
            "You are given a list of file names from a GitHub repository.",
            "Your task is to determine if any of these files are a maintainer file.",
            "If a maintainer file is found, return the file name as {file_name: <file_name>}",
            "If no maintainer file is found, return {error: 'not_found'}.",
            "If the list of files is empty, return {error: 'not_found'}.",
            "The file is never CONTRIBUTING.md"
            "As an example, this is the kind of files you are looking for:",
            "{EXAMPLE_FILES}Here is the list of file names and their contents:",
            "{FILE_NAMES}",
        )
        replacements = {"EXAMPLE_FILES": self.MAINTAINER_FILES, "FILE_NAMES": file_names}
        result = await invoke_bedrock(
            instructions, pydantic_model=MaintainerFile, replacements=replacements
        )

        if result.output.file_name is not None:
            file_name = result.output.file_name
            return file_name, result.cost
        else:
            return None, result.cost

    async def find_maintainer_file(self, repo_path: str, owner: str, repo: str):
        self.logger.info(f"Looking for maintainer files in {owner}/{repo}...")

        file_names = await aiofiles.os.listdir(repo_path)

        for file in self.MAINTAINER_FILES:
            file_path = os.path.join(repo_path, file)
            if await aiofiles.os.path.isfile(file_path):
                self.logger.info(f"maintainer file: {file_path} found in repo")
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    content = await f.read()
                return file, base64.b64encode(content.encode()).decode(), 0

        self.logger.warning("No maintainer files found using the known file names.")

        file_name, ai_cost = await self.find_maintainer_file_with_ai(file_names)

        if file_name:
            file_path = os.path.join(repo_path, file_name)
            if await aiofiles.os.path.isfile(file_path):
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    content = await f.read()
                self.logger.info(f"\nMaintainer file found: {file_name}")
                return file_name, base64.b64encode(content.encode()).decode(), ai_cost

        return None, None, ai_cost

    async def extract_maintainers(self, repo_path: str, owner: str, repo: str):
        total_cost = 0

        self.logger.info("Looking for maintainer file...")
        maintainer_file, file_content, cost = await self.find_maintainer_file(
            repo_path, owner, repo
        )
        total_cost += cost

        if not maintainer_file or not file_content:
            self.logger.error("No maintainer file found")
            raise MaintainerFileNotFoundError(ai_cost=total_cost)

        decoded_content = base64.b64decode(file_content).decode("utf-8")

        self.logger.info(f"Analyzing maintainer file: {maintainer_file}")
        result = await self.analyze_file_content(decoded_content)
        maintainer_info = result.output.info
        total_cost += result.cost

        if not maintainer_info:
            self.logger.error("Failed to analyze the maintainer file content.")
            raise MaintanerAnalysisError(ai_cost=total_cost)

        return MaintainerResult(
            maintainer_file=maintainer_file,
            maintainer_info=maintainer_info,
            total_cost=total_cost,
        )

    async def process_maintainers(
        self,
        repo_id: str,
        repo_url: str,
        repo_path: str,
        maintainer_file: str | None = None,
        last_maintainer_run_at: datetime | None = None,
    ) -> None:
        start_time = time_module.time()
        execution_status = ExecutionStatus.SUCCESS
        error_code = None
        error_message = None
        latest_maintainer_file = None

        try:
            self.logger.info(f"Starting maintainers processing for repo: {repo_url}")
            owner, repo_name = parse_repo_url(repo_url)
            if owner == "envoyproxy":  # TODO: remove this once we figure out why it was disabled
                self.logger.warning("Skiping maintainers processing for 'envoyproxy' repositories")
                # Skip envoyproxy repos (based on previous logic https://github.com/CrowdDotDev/git-integration/blob/06d6395e57d9aad7f45fde2e3d7648fb7440f83b/crowdgit/maintainers.py#L86)
                return

            # Check if configured days interval has passed since last run for repos without maintainers file
            if not maintainer_file and last_maintainer_run_at:
                days_since_last_run = (datetime.now(timezone.utc) - last_maintainer_run_at).days
                if days_since_last_run < MAINTAINER_RETRY_INTERVAL_DAYS:
                    self.logger.info(
                        f"Repo without maintainers file will be processed only after {MAINTAINER_RETRY_INTERVAL_DAYS} days. Days since last run: {days_since_last_run}"
                    )
                    return
                self.logger.info(
                    f"{MAINTAINER_RETRY_INTERVAL_DAYS} days have passed, processing repo without maintainers file. Days since last run: {days_since_last_run}"
                )

            maintainers = await self.extract_maintainers(repo_path, owner, repo_name)
            latest_maintainer_file = maintainers.maintainer_file
            self.logger.info(
                f"Extracted {len(maintainers.maintainer_info)} maintainers from {latest_maintainer_file} file"
            )
            await self.save_maintainers(
                repo_id, repo_url, maintainers.maintainer_info, last_maintainer_run_at
            )
        except Exception as e:
            execution_status = ExecutionStatus.FAILURE
            error_message = e.error_message if isinstance(e, CrowdGitError) else repr(e)
            error_code = (
                e.error_code.value if isinstance(e, CrowdGitError) else ErrorCode.UNKNOWN.value
            )

            self.logger.error(f"Maintainer processing failed: {error_message}")
        finally:
            await update_maintainer_run(repo_id, latest_maintainer_file)

            end_time = time_module.time()
            execution_time = Decimal(str(round(end_time - start_time, 2)))

            service_execution = ServiceExecution(
                repo_id=repo_id,
                operation_type=OperationType.MAINTAINER,
                status=execution_status,
                error_code=error_code,
                error_message=error_message,
                execution_time_sec=execution_time,
            )
            await save_service_execution(service_execution)
