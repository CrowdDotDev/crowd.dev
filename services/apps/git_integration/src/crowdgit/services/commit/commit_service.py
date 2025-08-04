from typing import Dict, Any, Optional, List, Tuple
from loguru import logger
import hashlib
from crowdgit.services.base.base_service import BaseService
from crowdgit.services.utils import get_default_branch
from crowdgit.services.utils import run_shell_command
import re
import time
import datetime
import asyncio
from crowdgit.settings import MAX_WORKER_PROCESSES
from concurrent.futures import ProcessPoolExecutor
from tenacity import retry, stop_after_attempt, wait_fixed
import subprocess
from crowdgit.services.commit.activitymap import ActivityMap


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

    def __init__(self):
        super().__init__()
        self.process_pool = None

    def _get_or_create_pool(self) -> ProcessPoolExecutor:
        """Get or create process pool with proper lifecycle management"""
        max_workers = max(1, MAX_WORKER_PROCESSES - 1)
        if self.process_pool is None:
            self.process_pool = ProcessPoolExecutor(max_workers=max_workers)
        return self.process_pool

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

    async def process_batch_commits(
        self, repo_path: str, edge_commit: Optional[str], prev_batch_edge_commit: str, remote: str
    ) -> List[Dict[str, Any]]:
        """
        Extract commits from repository in batches.

        Args:
            repo_path: Path to the Git repository.
            edge_commit: The edge commit for the current batch. It should be excluded from processing because its data may be incomplete or inaccurate.
            prev_batch_edge_commit: The edge commit from the previous batch. Which is used as the starting point (included) for the current batch processing.
        Returns:
            List of commit dictionaries

        Raises:
            RuntimeError: If git operations fail
        """
        try:
            start_time = time.time()
            self.logger.info(
                f"Starting commits processing for new batch having commits older than {prev_batch_edge_commit}"
            )
            raw_commits = await self._execute_git_log(
                repo_path, prev_batch_edge_commit, edge_commit
            )

            activities = await self._parse_activities_from_commits(
                raw_commits, repo_path, edge_commit, remote
            )

            end_time = time.time()
            processing_time = end_time - start_time

            self.logger.info(
                f"{len(activities)} activity extracted from {remote} in {int(processing_time)}sec ({processing_time / 60:.2f} min)"
            )

            return activities

        except Exception as e:
            # TODO: return unified Result object for all services including status and error code/message
            self.logger.error(f"Failed to get commits for batch from {repo_path}: {e}")
            return None

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
        prev_batch_edge_commit: Optional[str] = None,
        edge_commit: Optional[str] = None,
    ) -> str:
        """Execute git log command and return raw output."""
        # Ensure abbreviated commits are disabled
        await run_shell_command(
            ["git", "-C", repo_path, "config", "core.abbrevCommit", "false"], cwd=repo_path
        )

        self.logger.info("Running git log command...")

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
    def should_skip_commit(raw_commit: Optional[str], edge_commit: Optional[str]) -> bool:
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
        commit: Dict,
        activity_type: str,
        member: Dict,
        source_id: str,
        source_parent_id: str = "",
    ) -> Dict:
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
        username = member.get("username") or primary_email
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
        }

    @staticmethod
    def extract_activities(commit_message: List[str]) -> List[Dict[str, Dict[str, str]]]:
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
    def create_activities_from_commit(remote: str, commit: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Create activities from a commit with improved efficiency.

        Args:
            remote: The remote repository URL
            commit: The commit dictionary containing commit data

        Returns:
            List of activity dictionaries
        """
        activities = []
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
        activities.append(
            CommitService.create_activity(remote, commit, "authored-commit", author, commit_hash)
        )

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
            activities.append(
                CommitService.create_activity(
                    remote,
                    commit,
                    "committed-commit",
                    committer,
                    committer_source_id,
                    commit_hash,
                )
            )

        return activities

    @staticmethod
    def parse_commits_chunk(
        commit_texts_chunk: List[Optional[str]],
        repo_path: str,
        edge_commit_hash: Optional[str],
        remote: str,
    ) -> List[Dict[str, Any]]:
        """
        Parse a chunk of commit texts into activities with improved efficiency.

        Args:
            commit_texts_chunk: List of commit text strings to process
            repo_path: Path to the repository
            edge_commit_hash: Edge commit hash for filtering
            remote: Remote repository URL

        Returns:
            List of activity dictionaries
        """
        activities = []
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
                    activities.extend(CommitService.create_activities_from_commit(remote, commit))
                    processed_commits += 1
                else:
                    bad_commits += 1
            except Exception as e:
                logger.warning(f"Failed to parse commit in {repo_path}: {e}")
                bad_commits += 1
                continue

        if processed_commits > 0 or bad_commits > 0:
            logger.info(
                f"Processed {processed_commits} commits, skipped {bad_commits} invalid commits in {repo_path}"
            )

        return activities

    async def _parse_activities_from_commits(
        self, raw_output: str, repo_path: str, edge_commit_hash: Optional[str], remote: str
    ) -> List[Dict[str, Any]]:
        """
        Parse raw git log output into commit dictionaries.
        """
        activities = []

        commit_texts = [c.strip() for c in raw_output.split(self.COMMIT_END_SPLITTER) if c.strip()]
        logger.info(f"Actual number of commits to be processed: {len(commit_texts)}")
        chunk_size = min(max(1, len(commit_texts) // MAX_WORKER_PROCESSES), self.MAX_CHUNK_SIZE)

        self.logger.info(f"Spliting commits into chunks of {chunk_size}")
        chunks = [
            commit_texts[i : i + chunk_size] for i in range(0, len(commit_texts), chunk_size)
        ]
        loop = asyncio.get_event_loop()

        executor = self._get_or_create_pool()

        futures = [
            loop.run_in_executor(
                executor,
                CommitService.parse_commits_chunk,
                chunk,
                repo_path,
                edge_commit_hash,
                remote,
            )
            for chunk in chunks
        ]
        results = await asyncio.gather(*futures)
        activities = [item for sublist in results for item in sublist]
        return activities

    @staticmethod
    def _validate_commit_structure(commit_lines: List[str]) -> bool:
        """Validate that commit has minimum required fields."""
        return len(commit_lines) >= CommitService.MIN_COMMIT_FIELDS

    @staticmethod
    def _validate_commit_data(commit_dict: Dict[str, Any]) -> bool:
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

    @staticmethod
    def get_insertions_deletions(commit_hash: str, repo_path: str) -> Tuple[int, int]:
        try:
            # Use git show which works for all cases: normal commits, root commits, and shallow boundary commits
            result = subprocess.run(
                ["git", "-C", repo_path, "show", "--numstat", "--format=", commit_hash],
                capture_output=True,
                text=True,
                check=True,
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

        except (subprocess.CalledProcessError, ValueError, IndexError) as e:
            logger.error(f"Error getting insertions/deletions for commit {commit_hash}: {e}")
            return 0, 0

    @staticmethod
    def _construct_commit_dict(commit_metadata_lines: List[str], repo_path: str) -> Dict[str, Any]:
        """Create commit dictionary from parsed lines."""
        commit_hash = commit_metadata_lines[0]
        author_datetime = commit_metadata_lines[1]
        author_name = commit_metadata_lines[2]
        author_email = commit_metadata_lines[3]
        commit_datetime = commit_metadata_lines[4]
        committer_name = commit_metadata_lines[5]
        committer_email = commit_metadata_lines[6]
        parent_hashes = commit_metadata_lines[7].split()

        # Handle optional fields safely
        ref_names = commit_metadata_lines[8].strip() if len(commit_metadata_lines) > 8 else ""
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

        except ValueError as e:
            logger.warning(
                f"Invalid commit datetime format: {commit_datetime}, using author datetime"
            )
            return author_datetime
