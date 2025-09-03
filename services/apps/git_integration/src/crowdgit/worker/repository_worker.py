import asyncio

# Import configured loguru logger from crowdgit.logger
from crowdgit.logger import logger
from crowdgit.services import (
    CloneService,
    CommitService,
    SoftwareValueService,
    MaintainerService,
    QueueService,
)
from crowdgit.services.utils import get_repo_name
from crowdgit.errors import InternalError
from crowdgit.database.crud import (
    acquire_repo_for_processing,
    release_repo,
    mark_repo_as_processed,
    update_last_processed_commit,
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
        queue_service: QueueService,
    ):
        self.clone_service = clone_service
        self.commit_service = commit_service
        self.software_value_service = software_value_service
        self.maintainer_service = maintainer_service
        self.queue_service = queue_service
        self._shutdown = False

    async def run(self):
        """Run the worker processing loop"""
        logger.info("Starting repository worker")

        try:
            await self._run()
            logger.info("Worker _run() method completed")
        except Exception as e:
            logger.error("Worker failed: {}", e)
            raise InternalError("Repository worker failed")
        finally:
            logger.info("Worker run() method exiting")

    async def _run(self):
        """Internal run method with the processing loop"""
        try:
            logger.info("Starting repo worker loop...")
            while not self._shutdown:
                try:
                    await self._process_repositories()
                    await asyncio.sleep(WORKER_POLLING_INTERVAL_SEC)
                except Exception as e:
                    logger.error("Worker error: {}", e)
                    await asyncio.sleep(WORKER_ERROR_BACKOFF_SEC)
            logger.info("Worker loop completed")
        finally:
            logger.info("Worker processing loop completed")

    async def shutdown(self):
        """Shutdown the worker and all its services"""
        logger.info("Shutting down repository worker")
        self._shutdown = True

        logger.info("Worker services shutdown triggered")

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
                logger.debug("No repositories to process")
                return

            await self._process_single_repository(available_repo_to_process)
        except Exception as e:
            logger.error(
                f"Failed to process repository {available_repo_to_process} with error {e}"
            )
        finally:
            if available_repo_to_process:
                logger.info("releasing repo: ", available_repo_to_process.url)
                await release_repo(available_repo_to_process.id)
                logger.info(f"Repo {available_repo_to_process.url} released!")

    def _bind_repository_context(self, repository: Repository, repo_name: str) -> None:
        """Bind repository context to all services for enhanced logging

        Args:
            repository: Repository object containing metadata
            repo_name: Parsed repository name for logging
        """
        # Define services with their operation names
        services_operations = [
            (self.clone_service, "cloning"),
            (self.commit_service, "commit_processing"),
            (self.maintainer_service, "maintainer_processing"),
            (self.software_value_service, "software_value_processing"),
            (self.queue_service, "queue_service"),
        ]

        # Bind consistent context for all services: repo_name, id, and operation
        for service, operation in services_operations:
            service.bind_context(repo=repo_name, id=repository.id, operation=operation)

    def _reset_all_contexts(self) -> None:
        """Reset logger context for all services"""
        services = [
            self.clone_service,
            self.commit_service,
            self.maintainer_service,
            self.software_value_service,
            self.queue_service,
        ]

        for service in services:
            service.reset_logger_context()

    async def _process_single_repository(self, repository: Repository):
        """Process a single repository through services with incremental processing"""
        logger.info("Processing repository: {}", repository.url)
        processing_state = RepositoryState.PENDING

        try:
            repo_name = get_repo_name(repository.url)
            self._bind_repository_context(repository, repo_name)
            # 1. Clone the repository incrementally (check possibility to find commit before starting commits)
            logger.info("Starting repository cloning...")
            async for batch in self.clone_service.clone_batches_generator(
                repo_id=repository.id,
                remote=repository.url,
                target_commit_hash=repository.last_processed_commit,
                working_dir_cleanup=True,
            ):
                logger.info(f"Clone batch info: {batch}")
                if batch.is_first_batch:
                    await self.software_value_service.run(repository.id, batch.repo_path)
                    await self.maintainer_service.process_maintainers(
                        repo_id=repository.id,
                        repo_url=batch.remote,
                        repo_path=batch.repo_path,
                        maintainer_file=repository.maintainer_file,
                        last_maintainer_run_at=repository.last_maintainer_run_at,
                    )
                else:
                    await self.commit_service.process_single_batch_commits(
                        repo_id=repository.id,
                        repo_path=batch.repo_path,
                        edge_commit=batch.edge_commit,
                        prev_batch_edge_commit=batch.prev_batch_edge_commit,
                        remote=batch.remote,
                        segment_id=repository.segment_id,
                        integration_id=repository.integration_id,
                        is_final_batch=batch.is_final_batch,
                    )

                if batch.is_final_batch:
                    await update_last_processed_commit(
                        repo_id=repository.id, commit_hash=batch.latest_commit_in_repo
                    )

            logger.info("Incremental processing completed successfully")
            processing_state = RepositoryState.COMPLETED
        except Exception as e:
            processing_state = RepositoryState.FAILED
            logger.error(f"Processing failed with error: {repr(e)}")
        finally:
            # Reset logger context for all services
            self._reset_all_contexts()

            logger.info(f"Updating ${repository.url} state to ${processing_state}")
            await mark_repo_as_processed(repository.id, processing_state)

        logger.info("Completed processing repository: {}", repository.url)
