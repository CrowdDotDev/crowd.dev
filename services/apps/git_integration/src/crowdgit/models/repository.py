from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from crowdgit.enums import RepositoryPriority, RepositoryState
import uuid


class Repository(BaseModel):
    """Repository model"""

    id: str = Field(..., description="Repository ID")
    url: str = Field(..., description="Repository URL")
    segment_id: Optional[str] = Field(None, description="Segment ID")
    integration_id: Optional[str] = Field(None, description="Integration ID")
    state: RepositoryState = Field(default=RepositoryState.PENDING, description="Repository state")
    priority: int = Field(default=RepositoryPriority.NORMAL, description="Processing priority")
    last_processed_at: Optional[datetime] = Field(None, description="Last processing timestamp")
    last_processed_commit: Optional[str] = Field(None, description="Last processed commit hash")
    locked_at: Optional[datetime] = Field(
        None, description="Timestamp when repository was locked for processing"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    @classmethod
    def from_db(cls, db_data: Dict[str, Any]) -> "Repository":
        """Create Repository instance from database data"""
        # Convert database field names to model field names
        repo_data = db_data.copy()

        # Convert any UUID fields to strings
        for key, value in repo_data.items():
            if value is not None and isinstance(value, uuid.UUID):
                repo_data[key] = str(value)

        # Map database field names to model field names
        field_mapping = {
            "createdAt": "created_at",
            "updatedAt": "updated_at",
            "lastProcessedAt": "last_processed_at",
            "lastProcessedCommit": "last_processed_commit",
            "lockedAt": "locked_at",
            "segmentId": "segment_id",
            "integrationId": "integration_id",
        }
        for db_field, model_field in field_mapping.items():
            if db_field in repo_data:
                repo_data[model_field] = repo_data.pop(db_field)

        return cls(**repo_data)

    class Config:
        """Pydantic configuration"""

        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}


class RepositoryCreate(BaseModel):
    """Model for creating a new repository"""

    url: str = Field(..., description="Repository URL")
    segment_id: Optional[str] = Field(None, description="Segment ID")
    integration_id: Optional[str] = Field(None, description="Integration ID")
    priority: int = Field(default=RepositoryPriority.NORMAL, description="Processing priority")


class RepositoryResponse(BaseModel):
    """Response model for repository operations"""

    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    data: Optional[Repository] = Field(None, description="Repository data")
    error: Optional[str] = Field(None, description="Error message if any")
