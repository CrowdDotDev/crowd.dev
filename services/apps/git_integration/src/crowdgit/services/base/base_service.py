from crowdgit.logger import logger


class BaseService:
    """Abstract base class for repository processing services"""

    def __init__(self):
        """Initialize BaseService with configured logger"""
        self.logger = logger

    def bind_context(self, **context) -> None:
        """Bind contextual information to logger for enhanced logging

        Args:
            **context: Key-value pairs to add to all subsequent log messages
                      e.g., repo="github.com-user-repo", tenant_id="123", user_id="456"
        """
        self.logger = logger.bind(**context)

    def reset_logger_context(self) -> None:
        """Reset logger context to remove all bindings"""
        self.logger = logger
