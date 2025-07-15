from enum import Enum


class ErrorCode(str, Enum):
    """Standard Error codes"""

    UNKNOWN = "unknown"
    INTERNAL = "server-error"


class RepositoryState(str, Enum):
    """Repository processing states"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class RepositoryPriority(int):
    """Repository processing priorities"""

    URGENT = 0
    HIGH = 1
    NORMAL = 2
