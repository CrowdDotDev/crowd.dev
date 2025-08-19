from typing import Dict, Any
from loguru import logger
from crowdgit.services.utils import parse_repo_url
from crowdgit.services.base.base_service import BaseService
from crowdgit.errors import MaintainerFileNotFoundError, MaintanerAnalysisError
import os
import base64
import asyncio
import aiofiles
import aiofiles.os
from crowdgit.models.maintainer_info import (
    MaintainerFile,
    MaintainerInfo,
    MaintainerResult,
    AggregatedMaintainerInfo,
    AggregatedMaintainerInfoItems,
)
from crowdgit.services.maintainer.bedrock import invoke_bedrock


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
        try:
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
                raise ValueError(
                    "Expected a list of maintainer info or an error message, got: "
                    + str(maintainer_info)
                )
        except ValueError as e:
            raise

    async def find_maintainer_file_with_ai(self, file_names, owner, repo):
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
            # update_stats(file_name, owner, repo)
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

        file_name, ai_cost = await self.find_maintainer_file_with_ai(file_names, owner, repo)

        if file_name:
            file_path = os.path.join(repo_path, file_name)
            if await aiofiles.os.path.isfile(file_path):
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    content = await f.read()
                self.logger.info(f"\nMaintainer file found: {file_name}")
                return file_name, base64.b64encode(content.encode()).decode(), ai_cost

        return None, None, ai_cost

    async def extract_maintainers(
        self, repo_path: str, owner: str, repo: str, maintainers_file: str | None
    ):
        total_cost = 0

        if not maintainers_file:
            file_name, file_content, ai_cost = await self.find_maintainer_file(
                repo_path, owner, repo
            )
            total_cost += ai_cost

        if not file_name or not file_content:
            self.logger.error("No maintainer file found")
            raise MaintainerFileNotFoundError(ai_cost=total_cost)

        decoded_content = base64.b64decode(file_content).decode("utf-8")

        self.logger.info(f"Analyzing maintainer file: {file_name}")
        result = await self.analyze_file_content(decoded_content)
        maintainer_info = result.output.info
        total_cost += result.cost

        if not maintainer_info:
            self.logger.error("Failed to analyze the maintainer file content.")
            raise MaintanerAnalysisError(ai_cost=total_cost)

        return MaintainerResult(
            maintainer_file=file_name,
            maintainer_info=maintainer_info,
            total_cost=total_cost,
        )

    async def process_maintainers(
        self, repo_id: str, repo_url: str, repo_path: str, maintainers_file: str | None = None
    ):
        try:
            self.logger.info(f"Starting maintainers processing for repo: {repo_url}")
            owner, repo_name = parse_repo_url(repo_url)
            if owner == "envoyproxy":  # TODO: remove this once we figure out why it was disabled
                # Skip envoyproxy repos (based on previous logic https://github.com/CrowdDotDev/git-integration/blob/06d6395e57d9aad7f45fde2e3d7648fb7440f83b/crowdgit/maintainers.py#L86)
                return
            maintainers = await self.extract_maintainers(
                repo_path, owner, repo_name, maintainers_file
            )
            self.logger.info("Maintainers extracted")
            self.logger.info(maintainers)
        except Exception as e:
            # TODO: handle errors properly
            self.logger.error(f"Failed to process maintainers with error: {repr(e)}")
            raise
