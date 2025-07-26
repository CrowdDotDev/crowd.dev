from typing import Optional
from pydantic import BaseModel, Field


class CloneBatchInfo(BaseModel):
    """Model for clone batch information during repository cloning operations"""

    repo_path: Optional[str] = Field(None, description="Local repository path")
    remote: str = Field(..., description="Remote repository URL")
    is_final_batch: bool = Field(default=False, description="Whether this is the final batch")
    is_first_batch: bool = Field(default=True, description="Whether this is the first batch")
    latest_commit_in_repo: Optional[str] = Field(
        None, description="Hash of the latest commit in repo (not batch)"
    )
    commits_count: int = Field(default=0, description="Number of cloned commits for current batch")
    total_commits_count: int = Field(
        default=0, description="Total number of commits cloned so far"
    )
    prev_batch_oldest_commit: Optional[str] = Field(
        default=None, description="Whether this is the final batch"
    )

    class Config:
        """Pydantic configuration"""

        from_attributes = True
