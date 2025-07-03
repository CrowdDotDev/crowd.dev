from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from crowdgit.enums import RepositoryPriority, RepositoryState


class Repository(BaseModel):
    """Repository model"""

    id: str = Field(..., description="Repository ID")
    url: str = Field(..., description="Repository URL")
    state: RepositoryState = Field(default=RepositoryState.PENDING, description="Repository state")
    priority: int = Field(default=RepositoryPriority.NORMAL, description="Processing priority")
    last_processed_at: Optional[datetime] = Field(None, description="Last processing timestamp")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

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
