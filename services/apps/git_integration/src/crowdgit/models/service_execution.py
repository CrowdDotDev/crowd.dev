from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from crowdgit.enums import ExecutionStatus, OperationType
from decimal import Decimal


class ServiceExecution(BaseModel):
    """Model for creating a new service execution record"""

    repo_id: str = Field(..., description="Repository ID")
    operation_type: OperationType = Field(..., description="Service operation type")
    status: ExecutionStatus = Field(..., description="Execution status")
    error_code: Optional[str] = Field(None, description="Custom error code")
    error_message: Optional[str] = Field(None, description="Detailed error message")
    execution_time_sec: Decimal = Field(..., description="Execution time in seconds")

    def to_db_dict(self) -> Dict[str, Any]:
        """Convert create model to database dictionary"""
        return {
            "repoId": self.repo_id,
            "operationType": self.operation_type.value,
            "status": self.status.value,
            "errorCode": self.error_code,
            "errorMessage": self.error_message,
            "executionTimeSec": self.execution_time_sec,
        }
