from typing import Dict, Any, Optional, AsyncIterator
from loguru import logger
import tempfile
import re
import shutil
import os
from crowdgit.services.base.base_service import BaseService
from crowdgit.services.utils import run_shell_command, get_repo_name, get_default_branch
from crowdgit.models import CloneBatchInfo
from crowdgit.errors import CommandExecutionError
from tenacity import retry, stop_after_attempt, wait_fixed

# TODO: dynamically calculate depth: smaller for big repos and higher for small repos to acheive consistent (fast) processing duration without overkill
DEFAULT_CLONE_BATCH_DEPTH = 250


class CloneService(BaseService):
    """Service for cloning repositories"""

    async def _check_if_final_batch(self, path: str, target_commit_hash: Optional[str]) -> bool:
        """
        Final batch is determined if:
        - full history is cloned (no longer shallow_clone)
        - target commit reached
        """
        is_shallow_clone = await run_shell_command(
            ["git", "rev-parse", "--is-shallow-repository"], cwd=path
        )
        if "false" in is_shallow_clone:
            return True
        if not target_commit_hash:
            return False
        try:
            await run_shell_command(
                ["git", "rev-parse", "--verify", f"{target_commit_hash}^{{commit}}"], cwd=path
            )
            return True
        except CommandExecutionError:
            return False

    async def _init_minimal_clone(self, path: str, remote: str) -> None:
        """
        Inits minimal clone of depth=1
        """
        # increasing post buffer to avoid RPC failed error
        await run_shell_command(
            ["git", "config", "--global", "http.postBuffer", "524288000"], cwd=path
        )
        self.logger.info(f"Initializing minmal clone")
        await run_shell_command(
            ["git", "clone", "--depth=1", "--no-tags", "--single-branch", remote, path], cwd=path
        )
        self.logger.info("Minimal clone initialized successfully")

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_fixed(1),
        reraise=True,
    )
    async def _clone_next_batch(self, repo_path: str, batch_depth: int):
        default_branch = await get_default_branch(repo_path)
        self.logger.info(
            f"Fetching an additional {batch_depth} commits from {default_branch} branch"
        )
        await run_shell_command(
            ["git", "fetch", "origin", default_branch, f"--deepen={batch_depth}"], cwd=repo_path
        )

    async def _get_batch_commit_info(
        self,
        repo_path: str,
        total_commits_count: int,
        is_first_batch: bool = False,
    ) -> tuple[int, Optional[str]]:
        """
        Get commit information for the current batch including count and optionally latest commit.

        Args:
            repo_path: Path to the repository
            batch_depth: Number of commits to fetch in this batch
            total_commits_count: Number of commits already processed in previous batches
            is_first_batch: Whether this is the first batch (to get latest commit)

        Returns:
            tuple: (batch_commit_count, latest_commit_hash) where latest_commit_hash is only set for first batch
        """
        try:
            # Count all available commits in the repository
            #
            # IMPORTANT: git fetch --deepen={batch_depth} can fetch MORE commits than batch_depth
            # in repositories with merge commits and complex histories. To avoid counting mismatches
            # and overlapping batches, we count ALL available commits after each fetch operation
            # and calculate the actual batch size as the difference from previous total.
            commit_count_output = await run_shell_command(
                [
                    "git",
                    "rev-list",
                    "--count",
                    "HEAD",
                ],
                cwd=repo_path,
            )

            if commit_count_output.strip():
                total_available_commits = int(commit_count_output.strip())

                # Calculate actual commits in this batch
                actual_batch_size = total_available_commits - total_commits_count

                # Get latest commit only from first batch (need actual hash for this)
                latest_commit_in_repo = None
                if is_first_batch:
                    latest_commit_output = await run_shell_command(
                        ["git", "rev-parse", "HEAD"],
                        cwd=repo_path,
                    )
                    latest_commit_in_repo = latest_commit_output.strip()

                return actual_batch_size, latest_commit_in_repo

            return 0, None

        except Exception as e:
            self.logger.error(f"Failed to get batch commit info: {e}")
            raise

    async def _update_batch_info(
        self, batch_info: CloneBatchInfo, repo_path: str, target_commit_hash: Optional[str]
    ) -> None:
        """Update batch info with repo path, final batch status, and total processed commits count"""
        batch_info.repo_path = repo_path
        batch_info.is_final_batch = await self._check_if_final_batch(repo_path, target_commit_hash)
        (
            actual_batch_size,
            latest_commit_in_repo,
        ) = await self._get_batch_commit_info(
            repo_path, batch_info.total_commits_count, batch_info.is_first_batch
        )

        # Set latest commit only from first batch
        if batch_info.is_first_batch and latest_commit_in_repo:
            batch_info.latest_commit_in_repo = latest_commit_in_repo

        batch_info.commits_count = actual_batch_size
        batch_info.total_commits_count += actual_batch_size
        batch_info.edge_commit = await self._get_edge_commit(repo_path)

    async def _get_edge_commit(self, repo_path: str):
        """
        Returns the edge commit of a shallow clone by reading the .git/shallow file,
        which contains the boundary commit(s) when history is truncated.

        If the full history has been cloned, the .git/shallow file does not exist.
        """
        shallow_file = os.path.join(repo_path, ".git", "shallow")
        try:
            with open(shallow_file, "r") as f:
                oldest_commit = f.readline().strip()
            self.logger.info(f"Edge commit: {oldest_commit}")
            return oldest_commit
        except FileNotFoundError:
            return None

    async def clone_batches(
        self,
        remote: str,
        target_commit_hash: Optional[str] = None,
        batch_depth: int = DEFAULT_CLONE_BATCH_DEPTH,
    ) -> AsyncIterator[CloneBatchInfo]:
        """
        Async generator that yields CloneBatchInfo for each batch of repository cloning.
        """
        temp_repo_path = None
        batch_info = CloneBatchInfo(
            repo_path=temp_repo_path,
            remote=remote,
            is_final_batch=False,
            is_first_batch=True,
            total_commits_count=0,
        )
        try:
            temp_repo_path = tempfile.mkdtemp(prefix=f"{get_repo_name(remote)}_")
            batch_info.repo_path = temp_repo_path

            await self._init_minimal_clone(temp_repo_path, remote)
            await self._update_batch_info(batch_info, temp_repo_path, target_commit_hash)
            yield batch_info

            batch_info.is_first_batch = False
            while not batch_info.is_final_batch:
                batch_info.prev_batch_edge_commit = await self._get_edge_commit(temp_repo_path)
                await self._clone_next_batch(temp_repo_path, batch_depth)
                await self._update_batch_info(batch_info, temp_repo_path, target_commit_hash)
                yield batch_info
        except Exception as e:
            # TODO: catch and handle all cloning exceptions
            self.logger.error(f"Error during cloning: {e}")
            raise
        finally:
            if temp_repo_path and os.path.exists(temp_repo_path):
                self.logger.info(f"cleaning temp dir {temp_repo_path}")
                shutil.rmtree(temp_repo_path)
