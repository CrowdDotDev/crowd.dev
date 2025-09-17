import os
import tempfile

from crowdgit.repo import (
    get_default_branch,
    get_new_commits,
    get_repo_name,
    is_valid_commit_hash,
    is_valid_datetime,
)


def test_get_repo_name():
    assert get_repo_name("https://github.com/user/repo.git") == "repo"
    assert get_repo_name("https://github.com/user/another-repo.git") == "another-repo"
    assert (
        get_repo_name("https://github.com/user/repo_with_underscores.git")
        == "repo_with_underscores"
    )
    assert get_repo_name("https://github.com/user/repo/") == "repo"


def test_is_valid_commit_hash():
    assert is_valid_commit_hash("a" * 40)
    assert not is_valid_commit_hash("a" * 39)
    assert not is_valid_commit_hash("a" * 41)
    assert not is_valid_commit_hash("g" * 40)


def test_is_valid_datetime():
    assert is_valid_datetime("2021-09-01T00:00:00+00:00")
    assert is_valid_datetime("2021-09-01T00:00:00-00:00")
    assert not is_valid_datetime("2021-09-01T00:00:00")
    assert not is_valid_datetime("2021-09-01 00:00:00+00:00")


def test_get_default_branch():
    # Create a temporary directory for the test repository
    with tempfile.TemporaryDirectory() as temp_dir:
        repo_path = os.path.join(temp_dir, "test-repo")
        os.makedirs(repo_path)
        os.system(f"git init {repo_path}")
        assert get_default_branch(repo_path) == "master"


def test_get_new_commits():
    test_repo = "git@github.com:juanre/test-repo.git"
    repo_name = get_repo_name(test_repo)

    # Clone the test repo in a temp directory
    with tempfile.TemporaryDirectory() as temp_dir1:
        local_repo1 = os.path.join(temp_dir1, repo_name)
        os.system(f"git clone {test_repo} {local_repo1}")

        # Test get_new_commits
        new_commits1 = get_new_commits(test_repo, temp_dir1)
        assert isinstance(new_commits1, list)
        assert all("insertions" in commit and "deletions" in commit for commit in new_commits1)

        # Clone the test repo in another temp directory, modify a file, and push the changes
        with tempfile.TemporaryDirectory() as temp_dir2:
            local_repo2 = os.path.join(temp_dir2, repo_name)
            os.system(f"git clone {test_repo} {local_repo2}")

            # Modify the "afile" by deleting one line and adding two lines at the end
            import time  # Add this import

            timestamp = str(int(time.time()))  # Add this line to create a unique timestamp

            file_path = os.path.join(local_repo2, "afile")
            with open(file_path) as f:
                content = f.readlines()
            content.pop()  # Remove one line
            content.append(f"New line 1 {timestamp}\n")  # Add unique lines
            content.append(f"New line 2 {timestamp}\n")  # Add unique lines
            with open(file_path, "w") as f:
                f.writelines(content)

            os.system(f"git -C {local_repo2} add afile")
            os.system(f'git -C {local_repo2} commit -m "Modified afile"')
            os.system(f"git -C {local_repo2} push")

            # Test get_new_commits again
            new_commits2 = get_new_commits(test_repo, temp_dir1)
            assert len(new_commits2) == 1
            assert new_commits2[0]["insertions"] == 2
            assert new_commits2[0]["deletions"] == 1
