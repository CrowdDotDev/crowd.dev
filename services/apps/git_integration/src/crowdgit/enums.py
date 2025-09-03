from enum import Enum


class ErrorCode(str, Enum):
    """Standard Error codes"""

    UNKNOWN = "unknown"
    INTERNAL = "server-error"
    SHELL_COMMAND_TIMEOUT = "shell-command-timeout"
    DISK_SPACE = "disk-space-error"
    NETWORK_ERROR = "network-error"
    PERMISSION_ERROR = "permission-error"
    SHELL_COMMAND_FAILED = "shell-command-failed"
    QUEUE_EMIT_ERROR = "queue-emit-error"
    QUEUE_CONNECTION_ERROR = "queue-connection-error"
    VALIDATION = "validation"
    NO_MAINTAINER_FILE = "no-maintainer-file"
    MAINTAINER_ANALYSIS_FAILED = "maintainer_analysis_failed"


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


class IntegrationResultType(str, Enum):
    ACTIVITY = "activity"


class IntegrationResultState(str, Enum):
    PENDING = "pending"


class DataSinkWorkerQueueMessageType(str, Enum):
    PROCESS_INTEGRATION_RESULT = "process_integration_result"


class ExecutionStatus(str, Enum):
    """Service execution status"""

    SUCCESS = "success"
    FAILURE = "failure"


class OperationType(str, Enum):
    """Service operation types for metrics tracking"""

    CLONE = "Clone"
    COMMIT = "Commit"
    MAINTAINER = "Maintainer"
    SOFTWARE_VALUE = "SoftwareValue"
