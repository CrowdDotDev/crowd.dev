from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from crowdgit.enums import RepositoryPriority, RepositoryState


class Repository(BaseModel):
    """Repository model"""

    id: str = Field(..., description="Repository ID")
    url: str = Field(..., description="Repository URL")
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
        # Handle UUID conversion
        if "id" in repo_data and not isinstance(repo_data["id"], str):
            repo_data["id"] = str(repo_data["id"])
        # Map database field names to model field names
        field_mapping = {
            "createdAt": "created_at",
            "updatedAt": "updated_at",
            "lastProcessedAt": "last_processed_at",
            "lastProcessedCommit": "last_processed_commit",
            "lockedAt": "locked_at",
        }
        for db_field, model_field in field_mapping.items():
            if db_field in repo_data:
                repo_data[model_field] = repo_data.pop(db_field)
        return cls(**repo_data)

    @field_validator("id", mode="before")
    @classmethod
    def validate_id(cls, v):
        """Convert UUID to string if needed"""
        if v is not None:
            return str(v)
        return v

    class Config:
        """Pydantic configuration"""

        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}


class RepositoryCreate(BaseModel):
    """Model for creating a new repository"""

    url: str = Field(..., description="Repository URL")
    priority: int = Field(default=RepositoryPriority.NORMAL, description="Processing priority")


class RepositoryResponse(BaseModel):
    """Response model for repository operations"""

    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    data: Optional[Repository] = Field(None, description="Repository data")
    error: Optional[str] = Field(None, description="Error message if any")
