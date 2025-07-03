from dataclasses import dataclass
from crowdgit.enums import ErrorCode


@dataclass
class CrowdGitError(Exception):
    error_message: str = "An unknown error occurred"
    error_code: ErrorCode | None = ErrorCode.UNKNOWN


@dataclass
class InternalError(CrowdGitError):
    error_message: str = "Internal error"
    error_code: ErrorCode = ErrorCode.INTERNAL


class GitRunError(CrowdGitError):
    def __init__(self, remote, local_repo, e):
        super().__init__(f"Error running git with {remote} and {local_repo}: {e}")
