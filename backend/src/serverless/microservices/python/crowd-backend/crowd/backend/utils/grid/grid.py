from crowd.backend.infrastructure.logging import get_logger

logger = get_logger(__name__)

class BaseGrid:

    default = 2

    @classmethod
    def get_score(cls, action):
        action = action.replace("-", "_")
        if action in cls.__dict__:
            return cls.__dict__[action]
        return BaseGrid.default


class GithubGrid(BaseGrid):
    issues_opened = 8
    issues_closed = 6
    issue_comment = 6
    pull_request_opened = 10
    pull_request_closed = 8
    pull_request_comment = 6
    commit_comment = 3
    star = 2
    unstar = -2
    fork = 4

if __name__ == "__main__":
    logger.info(GithubGrid.get_score("issues-opened"))
