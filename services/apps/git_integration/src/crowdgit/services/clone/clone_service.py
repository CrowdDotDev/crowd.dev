from typing import Dict, Any, Optional, AsyncIterator
from loguru import logger
import tempfile
import re
import shutil
import os
from crowdgit.services.base.base_service import BaseService
from crowdgit.services.utils import run_shell_command, get_repo_name, get_default_branch
from crowdgit.models import CloneBatchInfo
from crowdgit.models.service_execution import ServiceExecution
from crowdgit.enums import ExecutionStatus, ErrorCode, OperationType
from crowdgit.database.crud import save_service_execution
from crowdgit.errors import CommandExecutionError, CrowdGitError
from tenacity import retry, stop_after_attempt, wait_fixed
import time
from decimal import Decimal

DEFAULT_CLONE_BATCH_DEPTH = 10


class CloneService(BaseService):
    """Service for cloning repositories"""

    def __init__(self):
        super().__init__()

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
            self.logger.info(f"Target commit {target_commit_hash} reached")
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
        self.logger.info("Initializing minimal clone")
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

    async def _cleanup_working_directory(self, repo_path: str) -> None:
        """
        Remove all files and directories from the repository except the .git directory.
        This helps reduce disk usage while preserving git history for commit processing.
        """
        try:
            self.logger.info(f"Cleaning working directory: {repo_path}")

            # Use find command to remove everything except .git directory
            await run_shell_command(
                [
                    "find",
                    ".",
                    "-mindepth",
                    "1",
                    "-maxdepth",
                    "1",
                    "!",
                    "-name",
                    ".git",
                    "-exec",
                    "rm",
                    "-rf",
                    "{}",
                    "+",
                ],
                cwd=repo_path,
            )

            self.logger.info("Working directory cleanup completed")

        except Exception as e:
            self.logger.error(f"Failed to cleanup working directory: {e}")
            # Don't raise the exception as cleanup failure shouldn't stop the cloning process
            # The process can continue with the files present

    async def _calculate_batch_depth(self, repo_path: str, remote: str) -> int:
        calculated_depth = None
        total_branches_tags = await run_shell_command(
            ["git", "ls-remote", "--heads", "--tags", remote], cwd=repo_path
        )
        total_branches_tags = len(total_branches_tags.splitlines())
        if total_branches_tags <= 200:
            # Small repo, get a decent amount of history
            calculated_depth = 250
        elif total_branches_tags <= 1000:
            # Medium repo, get a moderate amount of history
            calculated_depth = 150
        elif total_branches_tags <= 5000:
            # Large repo, get less history
            calculated_depth = 10
        else:
            # Very large repo, get a minimal history
            calculated_depth = 5
        self.logger.info(
            f"total_branches_tags={total_branches_tags}, calculated_depth={calculated_depth}"
        )
        return calculated_depth

    async def clone_batches(
        self,
        repo_id: str,
        remote: str,
        target_commit_hash: Optional[str] = None,
        working_dir_cleanup: Optional[bool] = False,
    ) -> AsyncIterator[CloneBatchInfo]:
        """
        Async generator that yields CloneBatchInfo for each batch of repository cloning.
        """
        temp_repo_path = None
        execution_status = ExecutionStatus.SUCCESS
        error_code = None
        error_message = None
        total_execution_time = 0.0

        batch_info = CloneBatchInfo(
            repo_path=temp_repo_path,
            remote=remote.removesuffix(".git"),
            is_final_batch=False,
            is_first_batch=True,
            total_commits_count=0,
        )
        try:
            temp_repo_path = tempfile.mkdtemp(prefix=f"{get_repo_name(remote)}_")
            batch_info.repo_path = temp_repo_path

            # First batch - initial clone
            batch_start_time = time.time()
            await self._init_minimal_clone(temp_repo_path, remote)
            batch_depth = await self._calculate_batch_depth(temp_repo_path, remote)
            await self._update_batch_info(batch_info, temp_repo_path, target_commit_hash)
            batch_end_time = time.time()
            total_execution_time += round(batch_end_time - batch_start_time, 2)

            yield batch_info
            if working_dir_cleanup:
                await self._cleanup_working_directory(temp_repo_path)

            batch_info.is_first_batch = False
            while not batch_info.is_final_batch:
                batch_start_time = time.time()
                batch_info.prev_batch_edge_commit = await self._get_edge_commit(temp_repo_path)
                await self._clone_next_batch(temp_repo_path, batch_depth)
                await self._update_batch_info(batch_info, temp_repo_path, target_commit_hash)
                batch_end_time = time.time()
                total_execution_time += round(batch_end_time - batch_start_time, 2)

                yield batch_info

        except Exception as e:
            # Handle both CrowdGitError and generic Exception
            execution_status = ExecutionStatus.FAILURE
            error_message = e.error_message if isinstance(e, CrowdGitError) else repr(e)
            error_code = (
                e.error_code.value if isinstance(e, CrowdGitError) else ErrorCode.UNKNOWN.value
            )
            self.logger.error(f"Cloning failed: {error_message}")
            raise
        finally:
            if temp_repo_path and os.path.exists(temp_repo_path):
                self.logger.info(f"cleaning temp dir {temp_repo_path}")
                shutil.rmtree(temp_repo_path)

            # Save metrics
            service_execution = ServiceExecution(
                repo_id=repo_id,
                operation_type=OperationType.CLONE,
                status=execution_status,
                error_code=error_code,
                error_message=error_message,
                execution_time_sec=Decimal(str(round(total_execution_time, 2))),
            )
            await save_service_execution(service_execution)
