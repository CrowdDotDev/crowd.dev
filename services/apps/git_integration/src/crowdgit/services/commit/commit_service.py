from typing import Dict, Any, Optional, List, Tuple
from loguru import logger
from crowdgit.repo import (
    get_commits,
    get_commits_by_hash_range,
    get_insertions_deletions_by_hash_range,
)
from crowdgit.services.base.base_service import BaseService
from crowdgit.services.utils import get_default_branch
import json
from crowdgit.services.utils import run_shell_command
import re
import time
import datetime
import os
import asyncio
from crowdgit.settings import MAX_WORKER_PROCESSES
from concurrent.futures import ProcessPoolExecutor
from tenacity import retry, stop_after_attempt, wait_fixed
import subprocess


class CommitService(BaseService):
    """Service for processing repository commits"""

    COMMIT_END_SPLITTER = "--CROWD-END-OF-COMMIT--"
    MIN_COMMIT_FIELDS = 8
    DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S%z"
    FUTURE_DATE_THRESHOLD_DAYS = 1

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
        return re.match(r"^[0-9a-f]{40}$", commit_hash) is not None

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

    async def get_commits_for_batch(
        self, repo_path: str, prev_batch_oldest_commit: str, is_first_batch: bool
    ) -> List[Dict[str, Any]]:
        """
        Extract commits from repository in batches.

        Args:
            repo_path: Path to the git repository
            prev_batch_oldest_commit: prev_batch_oldest_commit in batch - to be used as starting point for new commits
            is_first_batch: boolean to determine if 1st batch (specific handling since depth = 1)
        Returns:
            List of commit dictionaries

        Raises:
            RuntimeError: If git operations fail
        """
        try:
            start_time = time.time()
            self.logger.info(
                f"Starting commits processing for new batch having commits older than {prev_batch_oldest_commit}"
            )
            commit_reference = await self._get_commit_reference(repo_path)
            raw_output = await self._execute_git_log(
                repo_path, commit_reference, is_first_batch, prev_batch_oldest_commit
            )

            commits = await self._parse_commits(raw_output, repo_path)

            end_time = time.time()
            processing_time = end_time - start_time

            self.logger.info(
                f"{len(commits)} commits extracted from {repo_path} in "
                f"{int(processing_time)}sec ({processing_time / 60:.2f} min)"
            )

            return commits

        except Exception as e:
            self.logger.error(f"Failed to get commits for batch from {repo_path}: {e}")
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
        self, repo_path: str, commit_reference: str, is_first_batch: bool, prev_batch_oldest_commit
    ) -> str:
        """Execute git log command and return raw output."""
        # Ensure abbreviated commits are disabled
        await run_shell_command(
            ["git", "-C", repo_path, "config", "core.abbrevCommit", "false"], cwd=repo_path
        )
        self.logger.info("Running git log command...")
        first_batch_command = [
            "git",
            "-C",
            repo_path,
            "log",
            commit_reference,
            f"--pretty=format:{self.git_log_format}",
        ]
        next_batch_command = [
            "git",
            "-C",
            repo_path,
            "log",
            prev_batch_oldest_commit,  # Start from the previous batch's oldest commit
            "--reverse",
            "--skip=1",  # Skip that starting commit (prev_batch_oldest_commit) itself to avoid duplicates
            f"--pretty=format:{self.git_log_format}",
        ]
        git_log_command = first_batch_command if is_first_batch else next_batch_command

        self.logger.info(f"Executing log command: {git_log_command}")
        return await run_shell_command(git_log_command, cwd=repo_path, timeout=60)

    @staticmethod
    def parse_commits_chunk(commit_texts_chunk: List[str], repo_path: str) -> List[Dict[str, Any]]:
        commits = []
        bad_commits = 0
        for commit_text in commit_texts_chunk:
            commit_lines = commit_text.strip().splitlines()

            if not CommitService._validate_commit_structure(commit_lines):
                logger.warning(
                    f"Invalid commit structure in {repo_path}: {len(commit_lines)} fields"
                )
                bad_commits += 1
                continue

            try:
                commit_dict = CommitService._construct_commit_dict(commit_lines, repo_path)
                if CommitService._validate_commit_data(commit_dict):
                    commits.append(commit_dict)
                else:
                    bad_commits += 1
            except Exception as e:
                logger.warning(f"Failed to parse commit in {repo_path}: {e}")
                bad_commits += 1
                continue

        if bad_commits > 0:
            logger.info(f"Skipped {bad_commits} invalid commits in {repo_path}")
        return commits

    async def _parse_commits(self, raw_output: str, repo_path: str) -> List[Dict[str, Any]]:
        """
        Parse raw git log output into commit dictionaries.
        """
        commits = []
        bad_commits = 0
        start_time = time.time()
        commit_texts = [c for c in raw_output.strip().split(self.COMMIT_END_SPLITTER) if c]
        logger.info(f"Actual number of commits to be processed: {len(commit_texts)}")
        chunk_size = max(1, len(commit_texts) // (MAX_WORKER_PROCESSES * 6))
        self.logger.info(f"Spliting into chunks of {chunk_size}")
        # Split commit_texts into chunks
        chunks = [
            commit_texts[i : i + chunk_size] for i in range(0, len(commit_texts), chunk_size)
        ]
        loop = asyncio.get_event_loop()
        with ProcessPoolExecutor(max_workers=MAX_WORKER_PROCESSES) as executor:
            futures = [
                loop.run_in_executor(executor, CommitService.parse_commits_chunk, chunk, repo_path)
                for chunk in chunks
            ]
            results = await asyncio.gather(*futures)
        all_commits = [item for sublist in results for item in sublist]
        logger.info(f"Parsed {len(all_commits)} in {(time.time() - start_time)} seconds")
        return all_commits

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
