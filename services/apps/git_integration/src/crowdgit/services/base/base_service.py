from abc import ABC, abstractmethod
from typing import Dict, Any
from loguru import logger


class BaseService(ABC):
    """Abstract base class for repository processing services"""

    @abstractmethod
    async def process(self, **kwargs) -> Dict[str, Any]:
        """
        Process repository data and return results

        Args:
            **kwargs: Service-specific arguments (e.g., repo_url, repo_path, etc.)

        Returns:
            Processing results dictionary
        """
        pass

    async def cleanup(self, **kwargs) -> None:
        """Cleanup after processing (optional)"""
        pass
