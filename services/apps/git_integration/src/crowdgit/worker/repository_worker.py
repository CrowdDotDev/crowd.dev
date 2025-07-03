import asyncio
from typing import Dict, Any, List
from loguru import logger

from crowdgit.services import (
    CloneService,
    CommitService,
    SoftwareValueService,
    MaintainerService,
)
from crowdgit.errors import InternalError

POLLING_INTERVAL_SEC = 5
ERROR_BACKOFF_SEC = 10


class RepositoryWorker:
    """Worker that processes repositories through services"""

    def __init__(
        self,
        clone_service: CloneService,
        commit_service: CommitService,
        software_value_service: SoftwareValueService,
        maintainer_service: MaintainerService,
    ):
        self.clone_service = clone_service
        self.commit_service = commit_service
        self.software_value_service = software_value_service
        self.maintainer_service = maintainer_service
        self._shutdown = False

    async def run(self):
        """Run the worker processing loop"""
        logger.info("Starting repository worker")

        try:
            await self._run()
        except Exception as e:
            logger.error("Worker failed: {}", e)
            raise InternalError("Repository worker failed")

    async def _run(self):
        """Internal run method with the processing loop"""

        while not self._shutdown:
            try:
                await self._process_repositories()
                await asyncio.sleep(POLLING_INTERVAL_SEC)
            except Exception as e:
                logger.error("Worker error: {}", e)
                await asyncio.sleep(ERROR_BACKOFF_SEC)

    async def shutdown(self):
        """Shutdown the worker"""
        logger.info("Shutting down repository worker")
        self._shutdown = True

    async def _process_repositories(self):
        """Process pending repositories"""
        # TODO: Get repositories from database
        repositories = await self._get_pending_repositories()

        if not repositories:
            # TODO: remove before deploying to avoid spammy logs
            logger.debug("No repositories to process")
            return

        logger.info("Processing {} repositories", len(repositories))

        # TODO: remove sequential processing
        for repository in repositories:
            try:
                await self._process_single_repository(repository)
            except Exception as e:
                # TODO: Mark repository as failed
                logger.error("Failed to process repository")

    async def _get_pending_repositories(self) -> List[Dict[str, Any]]:
        """Get pending repositories from database"""
        # TODO: Implement database query
        return []

    async def _process_single_repository(self, repository: Dict[str, Any]):
        """Process a single repository through services with incremental processing"""
        logger.info("Processing repository: {}", repository.get("url", "unknown"))

        try:
            pass
            # 1. Clone the repository incrementally (check possibility to find commit before starting commits)
            # for each cloned batch (check concurrent processing)
            # . Process commits & send result to destination (ideally non-blocking)
            # . Analyze maintainers & send result to destination (ideally non-blocking)
            # . Calculate software value & send result to destination (ideally non-blocking)

            logger.info("Incremental processing completed successfully")

        except Exception as e:
            logger.error("Processing failed: {}", e)

        logger.info("Completed processing repository: {}", repository.get("url", "unknown"))
