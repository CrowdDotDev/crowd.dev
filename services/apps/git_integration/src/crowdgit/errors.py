# -*- coding: utf-8 -*-


class CrowdGitError(Exception):
    pass


class GitRunError(CrowdGitError):
    def __init__(self, remote, local_repo, e):
        super().__init__(f"Error running git with {remote} and {local_repo}: {e}")
