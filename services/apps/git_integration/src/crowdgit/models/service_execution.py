from decimal import Decimal
from typing import Any

import orjson
from pydantic import BaseModel, Field

from crowdgit.enums import ExecutionStatus, OperationType


class ServiceExecution(BaseModel):
    """Model for creating a new service execution record"""

    repo_id: str = Field(..., description="Repository ID")
    operation_type: OperationType = Field(..., description="Service operation type")
    status: ExecutionStatus = Field(..., description="Execution status")
    error_code: str | None = Field(None, description="Custom error code")
    error_message: str | None = Field(None, description="Detailed error message")
    execution_time_sec: Decimal = Field(..., description="Execution time in seconds")
    metrics: dict[str, Any] = Field(
        default_factory=dict, description="Service-specific execution metrics"
    )

    def to_db_dict(self) -> dict[str, Any]:
        """Convert create model to database dictionary"""
        return {
            "repoId": self.repo_id,
            "operationType": self.operation_type.value,
            "status": self.status.value,
            "errorCode": self.error_code,
            "errorMessage": self.error_message,
            "executionTimeSec": self.execution_time_sec,
            "metrics": orjson.dumps(self.metrics).decode(),
        }
