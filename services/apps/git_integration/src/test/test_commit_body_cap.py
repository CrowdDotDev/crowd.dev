import orjson
import pytest

from crowdgit.services.commit.commit_service import CommitService


@pytest.fixture
def commit_service():
    return CommitService(queue_service=None)


def _giant_commit(trailers: int, filler_lines: int) -> dict:
    message = ["fix: subject", ""]
    message += [f"filler line {i} " + "x" * 200 for i in range(filler_lines)]
    message += [f"Co-authored-by: Bot {i} <bot{i}@example.com>" for i in range(trailers)]
    return {
        "hash": "a" * 40,
        "author_datetime": "2026-09-05T17:29:20+05:30",
        "author_name": "Author",
        "author_email": "author@example.com",
        "committer_datetime": "2026-09-05T17:29:20+05:30",
        "committer_name": "Committer",
        "committer_email": "committer@example.com",
        "is_main_branch": True,
        "is_merge_commit": False,
        "message": message,
        "insertions": 1,
        "deletions": 0,
    }


def _bodies(activities_db: list[tuple]) -> list[str]:
    return [orjson.loads(row[2])["data"]["body"] for row in activities_db]


def test_activity_body_is_capped_for_giant_commit_messages(commit_service):
    commit = _giant_commit(trailers=1000, filler_lines=5000)
    full_message = "\n".join(commit["message"])
    assert len(full_message) > CommitService.MAX_ACTIVITY_BODY_CHARS

    activities_db, activities_queue = commit_service.create_activities_from_commit(
        "https://github.com/test/repo.git", commit, "segment", "integration", 0
    )

    bodies = _bodies(activities_db)
    assert len(bodies) == 1002
    assert len(activities_queue) == 1002
    assert all(len(body) == CommitService.MAX_ACTIVITY_BODY_CHARS for body in bodies)
    assert all(body == full_message[: CommitService.MAX_ACTIVITY_BODY_CHARS] for body in bodies)


def test_activity_body_is_untouched_for_normal_commit_messages(commit_service):
    commit = _giant_commit(trailers=2, filler_lines=3)
    full_message = "\n".join(commit["message"])

    activities_db, _ = commit_service.create_activities_from_commit(
        "https://github.com/test/repo.git", commit, "segment", "integration", 0
    )

    assert _bodies(activities_db) == [full_message] * 4
