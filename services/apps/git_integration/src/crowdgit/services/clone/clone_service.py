from typing import Dict, Any
from loguru import logger

from crowdgit.services.base.base_service import BaseService


class CloneService(BaseService):
    """Service for cloning repositories"""

    async def process(self, **kwargs) -> Dict[str, Any]:
        """
        Clone a repository to local storage
        """
        pass

    async def cleanup(self, **kwargs) -> None:
        """Clean up cloned repositories"""
        pass
