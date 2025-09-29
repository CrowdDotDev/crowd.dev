import asyncio
import datetime
import hashlib
import json
import re
import subprocess
import time
import uuid
from concurrent.futures import ProcessPoolExecutor
from decimal import Decimal
from typing import Any

from loguru import logger
from pydantic import validate_email
from tenacity import retry, stop_after_attempt, wait_fixed

from crowdgit.database.crud import batch_insert_activities, save_service_execution
from crowdgit.enums import (
    DataSinkWorkerQueueMessageType,
    ErrorCode,
    ExecutionStatus,
    IntegrationResultState,
    IntegrationResultType,
    OperationType,
)
from crowdgit.errors import CrowdGitError
from crowdgit.models import CloneBatchInfo, Repository, ServiceExecution
from crowdgit.services.base.base_service import BaseService
from crowdgit.services.commit.activitymap import ActivityMap
from crowdgit.services.queue.queue_service import QueueService
from crowdgit.services.utils import get_default_branch, run_shell_command
from crowdgit.settings import DEFAULT_TENANT_ID, MAX_WORKER_PROCESSES


class CommitService(BaseService):
    """Service for processing repository commits"""

    COMMIT_END_SPLITTER = "--CROWD-END-OF-COMMIT--"
    MIN_COMMIT_FIELDS = 8
    DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S%z"
    FUTURE_DATE_THRESHOLD_DAYS = 1

    # Pre-compiled regex patterns for better performance
    _COMMIT_HASH_PATTERN = re.compile(r"^[0-9a-f]{40}$")
    _ACTIVITY_PATTERN = re.compile(r"([^:]*):\s*(.*?)\s+<{1,2}([^>]+)>+$")

    # Common strings to avoid repeated string operations
    _GIT_PLATFORM = "git"
    _USERNAME_TYPE = "username"
    _EMAIL_TYPE = "email"
    _COMMITTED_COMMIT_SUFFIX = "commited-commit"

    MAX_CHUNK_SIZE = 250

    def __init__(self, queue_service: QueueService):
        super().__init__()
        self.process_pool = None
        self.queue_service = queue_service
        # Metrics tracking for current repository
        self._metrics_context = None

    def _get_or_create_pool(self) -> ProcessPoolExecutor:
        """Get or create process pool with proper lifecycle management"""
        max_workers = max(1, MAX_WORKER_PROCESSES - 1)
        if self.process_pool is None:
            self.process_pool = ProcessPoolExecutor(max_workers=max_workers)
        return self.process_pool

    def cleanup_process_pool(self):
        """Cleanup process pool to prevent resource leaks"""
        if self.process_pool:
            self.process_pool.shutdown(wait=False)
            self.process_pool = None

    @property
    def git_log_format(self) -> str:
        """Git log format string with commit splitter"""
        return f"%n%H%n%aI%n%an%n%ae%n%cI%n%cn%n%ce%n%P%n%d%n%B%n{self.COMMIT_END_SPLITTER}"

    @staticmethod
    def is_valid_commit_hash(commit_hash: str) -> bool:
        """Check if the given commit hash is valid.

        :param commit_hash: The commit hash.
        :return: True if the hash is valid, False otherwise.

        >>> is_valid_commit_hash("7d2fd738dbbca7af5d0f9a7c942a51fd0f7c5c5f")
        True
        >>> is_valid_commit_hash('not so')
        False
        """
        return CommitService._COMMIT_HASH_PATTERN.match(commit_hash) is not None

    @staticmethod
    def is_valid_datetime(commit_datetime: str) -> bool:
        """Check if the given datetime string is valid.

        :param commit_datetime: The datetime string.
        :return: True if the datetime string is valid, False otherwise.

        >>> is_valid_datetime("2021-09-01T10:20:30+00:00")
        True
        >>> is_valid_datetime("2021-09-01 10:20:30+00:00")
        False
        """
        try:
            time.strptime(commit_datetime, CommitService.DATETIME_FORMAT)
            return True
        except ValueError:
            return False

    async def process_single_batch_commits(
        self,
        repository: Repository,
        batch_info: CloneBatchInfo,
        clone_with_batches: bool,
    ) -> None:
        """
        Process commits from a cloned batch.

        Args:
            repo_path: Path to the Git repository.
            edge_commit: The edge commit for the current batch. It should be excluded from processing because its data may be incomplete or inaccurate.
            prev_batch_edge_commit: The edge commit from the previous batch. Which is used as the starting point (included) for the current batch processing.
            remote: Remote repository URL
            segment_id: Segment identifier
            integration_id: Integration identifier
            is_final_batch: Whether this is the final batch (triggers metrics saving)
        """
        # Initialize metrics context on first call
        if self._metrics_context is None:
            self._metrics_context = {
                "start_time": time.time(),
                "total_execution_time": 0.0,
                "execution_status": ExecutionStatus.SUCCESS,
                "error_code": None,
                "error_message": None,
            }

        batch_start_time = time.time()

        try:
            self.logger.info(
                f"Starting commits processing for new batch having commits older than {batch_info.prev_batch_edge_commit}"
            )
            raw_commits = await self._execute_git_log(
                batch_info.repo_path,
                clone_with_batches,
                batch_info.prev_batch_edge_commit,
                batch_info.edge_commit,
            )

            await self._process_activities_from_commits(
                raw_commits,
                batch_info.repo_path,
                batch_info.edge_commit,
                batch_info.remote,
                repository.segment_id,
                repository.integration_id,
            )

            batch_end_time = time.time()
            batch_time = round(batch_end_time - batch_start_time, 2)
            self._metrics_context["total_execution_time"] += batch_time

            self.logger.info(
                f"Batch activity processed from {batch_info.remote} in {batch_time}sec"
            )

            # Save metrics if this is the final batch
            if batch_info.is_final_batch:
                service_execution = ServiceExecution(
                    repo_id=repository.id,
                    operation_type=OperationType.COMMIT,
                    status=self._metrics_context["execution_status"],
                    error_code=self._metrics_context["error_code"],
                    error_message=self._metrics_context["error_message"],
                    execution_time_sec=Decimal(
                        str(round(self._metrics_context["total_execution_time"], 2))
                    ),
                )
                await save_service_execution(service_execution)
                # Reset metrics context after saving
                self._metrics_context = None

        except Exception as e:
            # Update metrics context with error info
            batch_end_time = time.time()
            batch_time = round(batch_end_time - batch_start_time, 2)
            self._metrics_context["total_execution_time"] += batch_time
            self._metrics_context["execution_status"] = ExecutionStatus.FAILURE

            error_message = e.error_message if isinstance(e, CrowdGitError) else repr(e)
            self._metrics_context["error_code"] = (
                e.error_code.value if isinstance(e, CrowdGitError) else ErrorCode.UNKNOWN.value
            )
            self._metrics_context["error_message"] = error_message

            self.logger.error(f"Commit processing failed: {error_message}")

            # Save metrics on error
            service_execution = ServiceExecution(
                repo_id=repository.id,
                operation_type=OperationType.COMMIT,
                status=self._metrics_context["execution_status"],
                error_code=self._metrics_context["error_code"],
                error_message=self._metrics_context["error_message"],
                execution_time_sec=Decimal(
                    str(round(self._metrics_context["total_execution_time"], 2))
                ),
            )
            await save_service_execution(service_execution)
            # Reset metrics context after saving
            self._metrics_context = None
            raise

    async def _get_commit_reference(self, repo_path: str) -> str:
        """Get the commit reference for git log command."""
        default_branch = await get_default_branch(repo_path)
        if default_branch == "*":  # detached HEAD
            return "HEAD"
        return f"origin/{default_branch}"

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_fixed(1),
        reraise=True,
    )
    async def _execute_git_log(
        self,
        repo_path: str,
        clone_with_batches: bool,
        prev_batch_edge_commit: str | None = None,
        edge_commit: str | None = None,
    ) -> str:
        """Execute git log command and return raw output."""
        # Ensure abbreviated commits are disabled
        await run_shell_command(
            ["git", "-C", repo_path, "config", "core.abbrevCommit", "false"], cwd=repo_path
        )

        self.logger.info("Running git log command...")
        if not clone_with_batches:
            commit_reference = await self._get_commit_reference(repo_path)
            self.logger.info(
                f"Full repo cloned in single batch, getting all commits in {commit_reference}"
            )
            return await run_shell_command(
                [
                    "git",
                    "-C",
                    repo_path,
                    "log",
                    commit_reference,
                    f"--pretty=format:{self.git_log_format}",
                ]
            )
        if not prev_batch_edge_commit:
            return ""

        if edge_commit:
            # Middle batches: Get the slice of history between the last batch's edge and this one's.
            # Note: In a history with merges, this can include commits from side branches that
            # might also be reachable from the final batch's starting point, causing potential duplicates.
            git_log_command = [
                "git",
                "-C",
                repo_path,
                "log",
                f"{edge_commit}..{prev_batch_edge_commit}",
                f"--pretty=format:{self.git_log_format}",
            ]
            self.logger.info(f"Processing middle batch: {edge_commit}..{prev_batch_edge_commit}")
        else:
            # Final batch: Get all commits from the last known edge to the root.
            git_log_command = [
                "git",
                "-C",
                repo_path,
                "log",
                prev_batch_edge_commit,
                f"--pretty=format:{self.git_log_format}",
            ]
            self.logger.info(f"Processing final batch from: {prev_batch_edge_commit} to root")

        self.logger.info(f"Executing log command: {git_log_command}")
        return await run_shell_command(git_log_command, cwd=repo_path, timeout=60)

    @staticmethod
    def should_skip_commit(raw_commit: str | None, edge_commit: str | None) -> bool:
        """Check if commit should be skipped based on edge commit comparison."""
        # Only skip the boundary commit of the current shallow clone.
        return not raw_commit or (edge_commit and raw_commit.startswith(edge_commit))

    @staticmethod
    def clean_up_username(name: str):
        name = re.sub(r"(?i)Reviewed[- ]by:", "", name)
        name = re.sub(r"(?i)from:", "", name)
        name = re.sub(r"(?i)cc:.*", "", name).strip()
        return name.strip()

    @staticmethod
    def create_activity(
        remote: str,
        commit: dict,
        activity_type: str,
        member: dict,
        source_id: str,
        segment_id: str,
        source_parent_id: str = "",
    ) -> dict:
        """
        Create an activity with improved efficiency.

        Args:
            remote: The remote repository URL
            commit: The commit dictionary
            activity_type: Type of activity
            member: Member information dictionary
            source_id: Source ID for the activity
            source_parent_id: Parent source ID (optional)

        Returns:
            Activity dictionary
        """
        # Pre-calculate timestamp to avoid repeated lookups
        timestamp = (
            commit["author_datetime"] if source_parent_id == "" else commit["committer_datetime"]
        )
        dt = datetime.datetime.fromisoformat(timestamp)

        # Pre-calculate common values
        emails = member["emails"]
        primary_email = emails[0]

        # Optimize member processing by creating a new dict instead of modifying the input
        processed_member = {}

        # Handle username and displayName with fallbacks
        display_name = member.get("displayName") or primary_email.split("@")[0]

        # Clean up names once
        processed_member["displayName"] = CommitService.clean_up_username(display_name)

        # Build identities list more efficiently
        identities = [
            {
                "platform": CommitService._GIT_PLATFORM,
                "value": primary_email,
                "type": CommitService._USERNAME_TYPE,
                "verified": True,
            }
        ]

        # Add email identities
        for email in emails:
            identities.append(
                {
                    "platform": CommitService._GIT_PLATFORM,
                    "value": email,
                    "type": CommitService._EMAIL_TYPE,
                    "verified": False,
                }
            )

        processed_member["identities"] = identities

        # Pre-calculate commit attributes to avoid repeated lookups
        insertions = commit.get("insertions", 0)
        deletions = commit.get("deletions", 0)
        return {
            "type": activity_type,
            "timestamp": timestamp,
            "sourceId": source_id,
            "sourceParentId": source_parent_id,
            "platform": CommitService._GIT_PLATFORM,
            "channel": remote,
            "body": "\n".join(commit["message"]),
            "isContribution": True,
            "attributes": {
                "insertions": insertions,
                "timezone": dt.tzname(),
                "deletions": deletions,
                "lines": insertions - deletions,
                "isMerge": commit["is_merge_commit"],
                "isMainBranch": True,
            },
            "url": remote,
            "member": processed_member,
            "segmentId": segment_id,
        }

    @staticmethod
    def extract_activities(commit_message: list[str]) -> list[dict[str, dict[str, str]]]:
        """
        Extract activities from the commit message and return a list of activities.
        Each activity in the list includes the activity and the person who made it,
        which in turn includes the name and the email.

        :param commit_message: A list of strings, where each string is a line of the commit message.
        :return: A list of dictionaries containing activities and the person who made them.

        >>> extract_activities([
        ...     "Signed-off-by: Arnd Bergmann <arnd@arndb.de>",
        ...     "reported-by: Guenter Roeck <linux@roeck-us.net>"
        ... ]) == [{'Signed-off-by': {'email': 'arnd@arndb.de', 'name': 'Arnd Bergmann'}},
        ...        {'Reported-by': {'email': 'linux@roeck-us.net', 'name': 'Guenter Roeck'}}]
        True
        """
        activities = []

        for line in commit_message:
            match = CommitService._ACTIVITY_PATTERN.match(line)
            if match:
                activity_name, name, email = match.groups()
                activity_name = activity_name.strip().lower()
                if activity_name in ActivityMap:
                    name = name.strip()
                    email = email.strip()
                    for activity in ActivityMap[activity_name]:
                        activities.append({activity: {"name": name, "email": email}})
        return activities

    @staticmethod
    def prepare_activity_for_db_and_queue(
        activity: dict, segment_id: str, integration_id: str
    ) -> tuple[tuple, dict]:
        activity["segmentId"] = segment_id
        result_id = str(uuid.uuid1())

        data_dict = {
            "type": IntegrationResultType.ACTIVITY,
            "data": activity,
        }
        activity_db = (
            result_id,
            IntegrationResultState.PENDING,
            json.dumps(data_dict),
            DEFAULT_TENANT_ID,
            integration_id,
        )
        operation = "upsert_activities_with_members"
        activity_kafka = {
            "message_id": f"{DEFAULT_TENANT_ID}-{operation}-{CommitService._GIT_PLATFORM}-{result_id}",
            "payload": json.dumps(
                {
                    "type": DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT,
                    "tenantId": DEFAULT_TENANT_ID,
                    "segmentId": segment_id,
                    "integrationId": integration_id,
                    "resultId": result_id,
                }
            ),
        }
        return activity_db, activity_kafka

    @staticmethod
    def create_activities_from_commit(
        remote: str, commit: dict[str, Any], segment_id: str, integration_id: str
    ) -> tuple[list[tuple], list[dict[str, Any]]]:
        """
        Create activities from a commit with improved efficiency.

        Args:
            remote: The remote repository URL
            commit: The commit dictionary containing commit data
            segment_id: Segment identifier
            integration_id: Integration identifier

        Returns:
            Tuple of (activities_db, activities_queue) lists
        """
        activities_db = []
        activities_queue = []
        commit_hash = commit["hash"]

        # Pre-calculate common values to avoid repeated lookups
        author_name = commit["author_name"]
        author_email = commit["author_email"]
        committer_name = commit["committer_name"]
        committer_email = commit["committer_email"]

        # Create author activity
        author = {
            "username": author_name,
            "displayName": author_name,
            "emails": [author_email],
        }
        activity = CommitService.create_activity(
            remote=remote,
            commit=commit,
            activity_type="authored-commit",
            member=author,
            source_id=commit_hash,
            segment_id=segment_id,
        )
        activity_db, activity_kafka = CommitService.prepare_activity_for_db_and_queue(
            activity, segment_id, integration_id
        )
        activities_db.append(activity_db)
        activities_queue.append(activity_kafka)

        # Only create committer activity if author and committer are different
        if author_name != committer_name or author_email != committer_email:
            # Pre-calculate hash components to avoid repeated string operations
            hash_input = f"{commit_hash}{CommitService._COMMITTED_COMMIT_SUFFIX}{committer_email}"
            committer_source_id = hashlib.sha1(hash_input.encode("utf-8")).hexdigest()

            committer = {
                "username": committer_name,
                "displayName": committer_name,
                "emails": [committer_email],
            }
            activity = CommitService.create_activity(
                remote=remote,
                commit=commit,
                activity_type="committed-commit",
                member=committer,
                source_id=committer_source_id,
                source_parent_id=commit_hash,
                segment_id=segment_id,
            )
            activity_db, activity_kafka = CommitService.prepare_activity_for_db_and_queue(
                activity, segment_id, integration_id
            )
            activities_db.append(activity_db)
            activities_queue.append(activity_kafka)

        # Process extracted activities from commit message
        extracted_activities = CommitService.extract_activities(commit["message"])
        for extracted_activity in extracted_activities:
            activity_type, member_data = list(extracted_activity.items())[0]

            # Convert activity type to lowercase and add "-commit" suffix
            # This matches the legacy behavior: "signed-off-by" -> "signed-off-commit"
            activity_type = activity_type.lower().replace("-by", "") + "-commit"

            member = {
                "username": member_data["email"],
                "displayName": member_data["name"],
                "emails": [member_data["email"]],
            }

            # Generate unique source ID for extracted activity
            source_id = hashlib.sha1(
                (commit_hash + activity_type + member_data["email"]).encode("utf-8")
            ).hexdigest()
            activity = CommitService.create_activity(
                remote=remote,
                commit=commit,
                activity_type=activity_type,
                member=member,
                source_id=source_id,
                source_parent_id=commit_hash,
                segment_id=segment_id,
            )
            activity_db, activity_kafka = CommitService.prepare_activity_for_db_and_queue(
                activity, segment_id, integration_id
            )
            activities_db.append(activity_db)
            activities_queue.append(activity_kafka)

        return activities_db, activities_queue

    @staticmethod
    def process_commits_chunk(
        commit_texts_chunk: list[str | None],
        repo_path: str,
        edge_commit_hash: str | None,
        remote: str,
        segment_id: str,
        integration_id: str,
    ) -> list[tuple]:
        """
        Process a chunk of raw commit texts into activities.

        This is a low-level method used for parallel processing of commit data.
        It takes pre-split commit text chunks, converts them to activity objects,
        and returns them for batch processing in the main async context.

        Args:
            commit_texts_chunk: List of commit text strings to process
            repo_path: Path to the repository
            edge_commit_hash: Edge commit hash for filtering
            remote: Remote repository URL
            segment_id: Segment identifier
            integration_id: Integration identifier

        Returns:
            List of activity dictionaries for database insertion
        """
        activities_db = []
        activities_queue = []
        bad_commits = 0
        processed_commits = 0

        for commit_text in commit_texts_chunk:
            if CommitService.should_skip_commit(commit_text, edge_commit_hash):
                continue

            commit_lines = commit_text.strip().splitlines()
            if not CommitService._validate_commit_structure(commit_lines):
                logger.warning(
                    f"Invalid commit structure in {repo_path}: {len(commit_lines)} fields"
                )
                bad_commits += 1
                continue

            try:
                commit = CommitService._construct_commit_dict(commit_lines, repo_path)
                if CommitService._validate_commit_data(commit):
                    activity_db_records, activity_kafka = (
                        CommitService.create_activities_from_commit(
                            remote, commit, segment_id, integration_id
                        )
                    )
                    activities_db.extend(activity_db_records)
                    activities_queue.extend(activity_kafka)
                    processed_commits += 1
                else:
                    bad_commits += 1

            except Exception as e:
                logger.warning(f"Failed to parse commit in {repo_path}: {e}")
                bad_commits += 1
                continue

        logger.info(
            f"Processed {processed_commits} commits, skipped {bad_commits} invalid commits in {repo_path}"
        )

        return activities_db, activities_queue

    async def _process_activities_from_commits(
        self,
        raw_output: str,
        repo_path: str,
        edge_commit_hash: str | None,
        remote: str,
        segment_id: str,
        integration_id: str,
    ):
        """
        Parse raw git log output into commit dictionaries.
        """
        commit_texts = [c.strip() for c in raw_output.split(self.COMMIT_END_SPLITTER) if c.strip()]
        logger.info(f"Actual number of commits to be processed: {len(commit_texts)}")
        if len(commit_texts) == 0:
            self.logger.info("No commits to be processed")
            return
        chunk_size = min(max(20, len(commit_texts) // MAX_WORKER_PROCESSES), self.MAX_CHUNK_SIZE)

        self.logger.info(f"Spliting commits into chunks of {chunk_size}")
        chunks = [
            commit_texts[i : i + chunk_size] for i in range(0, len(commit_texts), chunk_size)
        ]
        self.logger.info(f"Total commits {len(commit_texts)} chunks {len(chunks)}")
        loop = asyncio.get_event_loop()

        executor = self._get_or_create_pool()

        futures = [
            loop.run_in_executor(
                executor,
                CommitService.process_commits_chunk,
                chunk,
                repo_path,
                edge_commit_hash,
                remote,
                segment_id,
                integration_id,
            )
            for chunk in chunks
        ]

        # Save each chunk's activities as they complete
        for future in asyncio.as_completed(futures):
            chunk_activities_db, chunk_activities_queue = await future
            if chunk_activities_db and chunk_activities_queue:
                await batch_insert_activities(chunk_activities_db)
                await self.queue_service.send_batch_activities(chunk_activities_queue)

    @staticmethod
    def _validate_commit_structure(commit_lines: list[str]) -> bool:
        """Validate that commit has minimum required fields."""
        return len(commit_lines) >= CommitService.MIN_COMMIT_FIELDS

    @staticmethod
    def _validate_commit_data(commit_dict: dict[str, Any]) -> bool:
        """Validate commit data content."""
        # Check required fields
        if not commit_dict.get("author_email", "").strip():
            logger.info(f"Commit without author_email: {commit_dict.get('hash', 'unknown')}")
            return False

        # Validate commit hash format
        if not CommitService.is_valid_commit_hash(commit_dict.get("hash", "")):
            logger.error(f"Invalid commit hash: {commit_dict.get('hash', 'unknown')}")
            return False

        # Validate datetime format
        if not CommitService.is_valid_datetime(commit_dict.get("committer_datetime", "")):
            logger.error(
                f"Invalid commit datetime: {commit_dict.get('committer_datetime', 'unknown')}"
            )
            return False

        return True

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_fixed(2),
    )
    @staticmethod
    def get_insertions_deletions(commit_hash: str, repo_path: str) -> tuple[int, int]:
        try:
            # Use git show which works for all cases: normal commits, root commits, and shallow boundary commits
            result = subprocess.run(
                ["git", "-C", repo_path, "show", "--numstat", "--format=", commit_hash],
                capture_output=True,
                text=True,
                check=True,
                timeout=120,
            )

            insertions, deletions = 0, 0
            # Process the multi-line output directly in Python.
            for line in result.stdout.splitlines():
                if line.strip():  # Skip empty lines
                    parts = line.split("\t")  # --numstat uses tabs
                    if len(parts) >= 2:
                        try:
                            insertions += int(parts[0])
                            deletions += int(parts[1])
                        except ValueError:
                            # Skip lines that don't have numeric values (e.g., binary files)
                            continue

            return insertions, deletions

        except Exception as e:
            logger.error(f"Error getting insertions/deletions for commit {commit_hash}: {e}")
            return 0, 0

    @staticmethod
    def _is_valid_email(email: str) -> bool:
        """Check if a string is a valid email format using Pydantic validation."""
        try:
            validate_email(email.strip())
            return True
        except Exception:
            return False

    @staticmethod
    def _construct_commit_dict(commit_metadata_lines: list[str], repo_path: str) -> dict[str, Any]:
        """Create commit dictionary from parsed lines."""
        commit_hash = commit_metadata_lines[0]
        author_datetime = commit_metadata_lines[1]
        author_name = commit_metadata_lines[2]
        author_email = commit_metadata_lines[3]
        commit_datetime = commit_metadata_lines[4]
        committer_name = commit_metadata_lines[5]
        committer_email = commit_metadata_lines[6]
        parent_hashes = commit_metadata_lines[7].split()

        # Use name as email if email is empty and name is a valid email
        author_email = (
            author_name
            if (not author_email or not author_email.strip())
            and CommitService._is_valid_email(author_name)
            else author_email
        )
        committer_email = (
            committer_name
            if (not committer_email or not committer_email.strip())
            and CommitService._is_valid_email(committer_name)
            else committer_email
        )

        # Handle optional fields safely
        commit_message = commit_metadata_lines[9:] if len(commit_metadata_lines) > 9 else []

        # Validate and adjust commit datetime if it's in the future
        adjusted_commit_datetime = CommitService._validate_and_adjust_datetime(
            commit_datetime, author_datetime
        )
        insertions, deletions = CommitService.get_insertions_deletions(commit_hash, repo_path)

        return {
            "hash": commit_hash,
            "author_datetime": author_datetime,
            "author_name": author_name,
            "author_email": author_email,
            "committer_datetime": adjusted_commit_datetime,
            "committer_name": committer_name,
            "committer_email": committer_email,
            "is_main_branch": True,
            "is_merge_commit": len(parent_hashes) > 1,
            "message": commit_message,
            "insertions": insertions,
            "deletions": deletions,
        }

    @staticmethod
    def _validate_and_adjust_datetime(commit_datetime: str, author_datetime: str) -> str:
        """Validate commit datetime and adjust if it's in the future."""
        try:
            commit_datetime_obj = datetime.datetime.strptime(
                commit_datetime, CommitService.DATETIME_FORMAT
            )
            future_threshold = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
                days=CommitService.FUTURE_DATE_THRESHOLD_DAYS
            )

            if commit_datetime_obj > future_threshold:
                logger.warning(
                    f"Commit datetime in future, using author datetime instead: {commit_datetime}"
                )
                return author_datetime

            return commit_datetime

        except ValueError:
            logger.warning(
                f"Invalid commit datetime format: {commit_datetime}, using author datetime"
            )
            return author_datetime
