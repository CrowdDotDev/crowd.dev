from typing import Optional
from pydantic import BaseModel, Field


class CloneBatchInfo(BaseModel):
    """Model for clone batch information during repository cloning operations"""

    repo_path: Optional[str] = Field(None, description="Local repository path")
    remote: str = Field(..., description="Remote repository URL")
    is_final_batch: bool = Field(default=False, description="Whether this is the final batch")
    is_first_batch: bool = Field(default=True, description="Whether this is the first batch")

    class Config:
        """Pydantic configuration"""

        from_attributes = True
