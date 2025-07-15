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
from crowdgit.database.crud import (
    acquire_repo_for_processing,
    release_repo,
    mark_repo_as_processed,
)
from crowdgit.settings import WORKER_ERROR_BACKOFF_SEC, WORKER_POLLING_INTERVAL_SEC
from crowdgit.models.repository import Repository
from crowdgit.enums import RepositoryState


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
        self.running_tasks: set[asyncio.Task] = set()

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
        try:
            while not self._shutdown:
                try:
                    await self._process_repositories()
                    await asyncio.sleep(WORKER_POLLING_INTERVAL_SEC)
                except Exception as e:
                    logger.error("Worker error: {}", e)
                    await asyncio.sleep(WORKER_ERROR_BACKOFF_SEC)
        finally:
            if self.running_tasks:
                logger.info(
                    f"Waiting for {len(self.running_tasks)} tasks to finish before shutdown"
                )
                await asyncio.gather(*self.running_tasks, return_exceptions=True)

    async def shutdown(self):
        """Shutdown the worker"""
        logger.info("Shutting down repository worker")
        self._shutdown = True

    async def _process_repositories(self):
        """
        Process repositories by priority - check acquire_repo_for_processing()
        For this inital version, we'll process repos one by one
        TODO: introduce concurrent processing of multiple repos if needed
        """
        available_repo_to_process = None
        try:
            available_repo_to_process = await acquire_repo_for_processing()

            if not available_repo_to_process:
                # TODO: remove before deploying to avoid spammy logs
                logger.debug("No repositories to process")
                return
            await self._process_single_repository(available_repo_to_process)
        except Exception as e:
            # TODO: Mark repository processing as failed
            logger.error(f"Failed to process repository {e}")
        finally:
            if available_repo_to_process:
                logger.info("releasing repo: ", available_repo_to_process.url)
                await release_repo(available_repo_to_process.id)

    async def _get_pending_repositories(self) -> List[Dict[str, Any]]:
        """Get pending repositories from database"""
        # TODO: Implement database query
        return []

    async def _process_single_repository(self, repository: Repository):
        """Process a single repository through services with incremental processing"""
        logger.info("Processing repository: {}", repository.url)
        processing_state = None
        try:
            # TODO: check if we want to consider all services (commits, maintainers, SV) as atomic
            # 1. Clone the repository incrementally (check possibility to find commit before starting commits)
            logger.info("Cloning repo...")
            await asyncio.sleep(1)
            # for each cloned batch (check concurrent processing)
            # . Process commits & send result to destination (ideally non-blocking)
            logger.info("Commits processing.....")
            await asyncio.sleep(1)
            # . Analyze maintainers & send result to destination (ideally non-blocking)
            # . Calculate software value & send result to destination (ideally non-blocking)
            logger.info("Maintainers & COCOMO processing...")
            await asyncio.sleep(1)

            logger.info("Incremental processing completed successfully")
            processing_state = RepositoryState.COMPLETED
        except Exception as e:
            processing_state = RepositoryState.FAILED
            logger.error("Processing failed: {}", e)
        finally:
            logger.info(f"Updating ${repository.url} state to ${processing_state}")
            await mark_repo_as_processed(repository.id, processing_state)

        logger.info("Completed processing repository: {}", repository.url)
