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


class CommitService(BaseService):
    """Service for processing repository commits"""

    # Constants
    COMMIT_SPLITTER = "--CROWD-END-OF-COMMIT--"
    MIN_COMMIT_FIELDS = 8
    DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S%z"
    FUTURE_DATE_THRESHOLD_DAYS = 1

    @property
    def git_log_format(self) -> str:
        """Git log format string with commit splitter"""
        return f"%H%n%aI%n%an%n%ae%n%cI%n%cn%n%ce%n%P%n%d%n%B%n{self.COMMIT_SPLITTER}"

    def is_valid_commit_hash(self, commit_hash: str) -> bool:
        """Check if the given commit hash is valid.

        :param commit_hash: The commit hash.
        :return: True if the hash is valid, False otherwise.

        >>> is_valid_commit_hash("7d2fd738dbbca7af5d0f9a7c942a51fd0f7c5c5f")
        True
        >>> is_valid_commit_hash('not so')
        False
        """
        return re.match(r"^[0-9a-f]{40}$", commit_hash) is not None

    def is_valid_datetime(self, commit_datetime: str) -> bool:
        """Check if the given datetime string is valid.

        :param commit_datetime: The datetime string.
        :return: True if the datetime string is valid, False otherwise.

        >>> is_valid_datetime("2021-09-01T10:20:30+00:00")
        True
        >>> is_valid_datetime("2021-09-01 10:20:30+00:00")
        False
        """
        try:
            time.strptime(commit_datetime, self.DATETIME_FORMAT)
            return True
        except ValueError:
            return False

    async def get_commits_for_batch(
        self, repo_path: str, batch_commits_count: int, total_cloned_commits: int
    ) -> List[Dict[str, Any]]:
        """
        Extract commits from repository in batches.

        Args:
            repo_path: Path to the git repository
            batch_commits_count: Number of commits to process in this batch
            total_cloned_commits: Total number of commits already processed

        Returns:
            List of commit dictionaries

        Raises:
            RuntimeError: If git operations fail
        """
        try:
            start_time = time.time()
            self.logger.info(
                f"Starting commits processing for new batch having {batch_commits_count} commits"
            )
            commit_reference = await self._get_commit_reference(repo_path)
            processed_commits_count = total_cloned_commits - batch_commits_count
            raw_output = await self._execute_git_log(
                repo_path, commit_reference, processed_commits_count
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

    async def _execute_git_log(
        self, repo_path: str, commit_reference: str, processed_commits_count: int
    ) -> str:
        """Execute git log command and return raw output."""
        # Ensure abbreviated commits are disabled
        await run_shell_command(
            ["git", "-C", repo_path, "config", "core.abbrevCommit", "false"], cwd=repo_path
        )

        git_log_command = [
            "git",
            "-C",
            repo_path,
            "log",
            commit_reference,
            f"--pretty=format:{self.git_log_format}",
            f"--skip={processed_commits_count}",
        ]

        return await run_shell_command(git_log_command, cwd=repo_path)

    async def _parse_commits(self, raw_output: str, repo_path: str) -> List[Dict[str, Any]]:
        """Parse raw git log output into commit dictionaries with periodic yielding."""
        commits = []
        bad_commits = 0

        commit_texts = raw_output.split(self.COMMIT_SPLITTER)
        # Filter out empty commit texts to avoid processing empty strings
        commit_texts = [text for text in commit_texts if text.strip()]

        for commit_text in commit_texts:
            commit_lines = commit_text.strip().splitlines()

            if not self._validate_commit_structure(commit_lines):
                self.logger.warning(
                    f"Invalid commit structure in {repo_path}: {len(commit_lines)} fields"
                )
                bad_commits += 1
                continue

            try:
                commit_dict = self._construct_commit_dict(commit_lines)
                if self._validate_commit_data(commit_dict):
                    commits.append(commit_dict)
                else:
                    bad_commits += 1
            except Exception as e:
                self.logger.warning(f"Failed to parse commit in {repo_path}: {e}")
                bad_commits += 1
                continue

        if bad_commits > 0:
            self.logger.info(f"Skipped {bad_commits} invalid commits in {repo_path}")

        return commits

    def _validate_commit_structure(self, commit_lines: List[str]) -> bool:
        """Validate that commit has minimum required fields."""
        return len(commit_lines) >= self.MIN_COMMIT_FIELDS

    def _validate_commit_data(self, commit_dict: Dict[str, Any]) -> bool:
        """Validate commit data content."""
        # Check required fields
        if not commit_dict.get("author_email", "").strip():
            self.logger.info(f"Commit without author_email: {commit_dict.get('hash', 'unknown')}")
            return False

        # Validate commit hash format
        if not self.is_valid_commit_hash(commit_dict.get("hash", "")):
            self.logger.error(f"Invalid commit hash: {commit_dict.get('hash', 'unknown')}")
            return False

        # Validate datetime format
        if not self.is_valid_datetime(commit_dict.get("committer_datetime", "")):
            self.logger.error(
                f"Invalid commit datetime: {commit_dict.get('committer_datetime', 'unknown')}"
            )
            return False

        return True

    def _construct_commit_dict(self, commit_lines: List[str]) -> Dict[str, Any]:
        """Create commit dictionary from parsed lines."""
        commit_hash = commit_lines[0]
        author_datetime = commit_lines[1]
        author_name = commit_lines[2]
        author_email = commit_lines[3]
        commit_datetime = commit_lines[4]
        committer_name = commit_lines[5]
        committer_email = commit_lines[6]
        parent_hashes = commit_lines[7].split()

        # Handle optional fields safely
        ref_names = commit_lines[8].strip() if len(commit_lines) > 8 else ""
        commit_message = commit_lines[9:] if len(commit_lines) > 9 else []

        # Validate and adjust commit datetime if it's in the future
        adjusted_commit_datetime = self._validate_and_adjust_datetime(
            commit_datetime, author_datetime
        )

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
        }

    def _validate_and_adjust_datetime(self, commit_datetime: str, author_datetime: str) -> str:
        """Validate commit datetime and adjust if it's in the future."""
        try:
            commit_datetime_obj = datetime.datetime.strptime(commit_datetime, self.DATETIME_FORMAT)
            future_threshold = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
                days=self.FUTURE_DATE_THRESHOLD_DAYS
            )

            if commit_datetime_obj > future_threshold:
                self.logger.warning(
                    f"Commit datetime in future, using author datetime instead: {commit_datetime}"
                )
                return author_datetime

            return commit_datetime

        except ValueError as e:
            self.logger.warning(
                f"Invalid commit datetime format: {commit_datetime}, using author datetime"
            )
            return author_datetime
