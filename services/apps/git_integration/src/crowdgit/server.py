import asyncio
import signal
from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger

from crowdgit.worker.repository_worker import RepositoryWorker
from crowdgit.services import (
    CloneService,
    CommitService,
    SoftwareValueService,
    MaintainerService,
)


def setup_signal_handlers(worker: RepositoryWorker):
    """Setup signal handlers for graceful shutdown"""

    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, initiating graceful shutdown")
        asyncio.create_task(worker.shutdown())

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """FastAPI lifespan context manager"""
    logger.info("Starting application lifespan")

    clone_service = CloneService()
    commit_service = CommitService()
    software_value_service = SoftwareValueService()
    maintainer_service = MaintainerService()

    worker = RepositoryWorker(
        clone_service=clone_service,
        commit_service=commit_service,
        software_value_service=software_value_service,
        maintainer_service=maintainer_service,
    )
    try:
        logger.info("Repo worker intialized")
        setup_signal_handlers(worker)
        worker_task = asyncio.create_task(worker.run())
        logger.info("RepositoryWorker started successfully")
        yield
    finally:
        logger.info("Shutting down application")
        # TODO: implement proper graceful shutdown to wait for processing tasks
        await worker.shutdown()
        logger.info("RepositoryWorker shutdown completed")

        # Wait for worker task to complete
        if not worker_task.done():
            logger.info("Waiting for worker task to complete")
            try:
                # TODO: define reasonable timeout based on task processing duration
                await asyncio.wait_for(worker_task, timeout=30.0)
                logger.info("Worker task completed successfully")
            except asyncio.TimeoutError:
                # TODO: handle it properly, sending slack alert or so...
                logger.warning("Worker task did not complete within timeout, cancelling")
                worker_task.cancel()
                try:
                    await worker_task
                except asyncio.CancelledError:
                    pass

        logger.info("Application shutdown completed")


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Git Integration Worker Running", "status": "healthy"}
