from pydantic import BaseModel, Field


class CloneBatchInfo(BaseModel):
    """Model for clone batch information during repository cloning operations"""

    repo_path: str | None = Field(None, description="Local repository path")
    remote: str = Field(..., description="Remote repository URL")
    is_final_batch: bool = Field(default=False, description="Whether this is the final batch")
    is_first_batch: bool = Field(default=True, description="Whether this is the first batch")
    latest_commit_in_repo: str | None = Field(
        None, description="Hash of the latest commit in repo"
    )
    edge_commit: str | None = Field(
        default=None,
        description="The oldest commit in the current batch, used to track progress during incremental processing.",
    )
    prev_batch_edge_commit: str | None = Field(
        default=None,
        description="The edge commit from the previous batch, used to track progress during incremental processing.",
    )
    clone_with_batches: bool = Field(
        default=True, description="Whether repo is cloned with batches"
    )

    class Config:
        """Pydantic configuration"""

        from_attributes = True
