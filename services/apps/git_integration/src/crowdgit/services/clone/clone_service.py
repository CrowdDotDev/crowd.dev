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

# TODO: dynamically calculate depth: smaller for big repos and higher for small repos to acheive consistent (fast) processing duration without overkill
DEFAULT_CLONE_BATCH_DEPTH = 100


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
        Inits a bare clone, determines the default branch, and perform a minimal clone of depth=1
        """
        self.logger.info(f"Initializing minmal clone")
        await run_shell_command(["git", "clone", "--depth=1", remote, path], cwd=path)
        self.logger.info(f"Minimal clone initialized successfully")

    async def _clone_next_batch(self, repo_path: str, batch_depth: int):
        self.logger.info(f"Fetching an additional {batch_depth} commits...")
        await run_shell_command(["git", "fetch", f"--deepen={batch_depth}"], cwd=repo_path)

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
        )
        try:
            temp_repo_path = tempfile.mkdtemp(prefix=f"{get_repo_name(remote)}")
            batch_info.repo_path = temp_repo_path

            await self._init_minimal_clone(temp_repo_path, remote)
            batch_info.is_final_batch = await self._check_if_final_batch(
                temp_repo_path, target_commit_hash
            )
            yield batch_info

            batch_info.is_first_batch = False
            while not batch_info.is_final_batch:
                await self._clone_next_batch(temp_repo_path, batch_depth)
                batch_info.is_final_batch = await self._check_if_final_batch(
                    temp_repo_path, target_commit_hash
                )
                yield batch_info
        except Exception as e:
            # TODO: catch and handle all cloning exceptions
            self.logger.error(f"Error during cloning: {e}")
            raise
        finally:
            if temp_repo_path and os.path.exists(temp_repo_path):
                self.logger.info(f"cleaning temp dir {temp_repo_path}")
                shutil.rmtree(temp_repo_path)

    async def process(self, **kwargs) -> Dict[str, Any]:
        """
        Clone a repository to local storage
        """
        pass

    async def cleanup(self, **kwargs) -> None:
        """Clean up cloned repositories"""
        pass
