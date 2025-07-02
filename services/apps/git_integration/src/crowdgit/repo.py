# -*- coding: utf-8 -*-

import os
import subprocess
import time
import re
from typing import List, Optional, Dict, Literal
import datetime

import tqdm

from crowdgit import LOCAL_DIR
import crowdgit.errors as E

from crowdgit.logger import get_logger

logger = get_logger(__name__)

DEFAULT_REPOS_DIR = os.path.join(LOCAL_DIR, "repos")
REPOS_DIR = os.environ.get("REPOS_DIR", DEFAULT_REPOS_DIR)

DEFAULT_BAD_COMMITS_DIR = os.path.join(LOCAL_DIR, "bad-commits")
BAD_COMMITS_DIR = os.environ.get("BAD_COMMITS_DIR", DEFAULT_BAD_COMMITS_DIR)


def get_repo_name(remote: str) -> str:
    """Get the domain and path segments from the remote URL and join them with '-'.

    :param remote: The remote URL of the repository.
    :return: The domain and path segments joined by '-', without the '.git' extension.

    >>> get_repo_name("https://github.com/user/repo.git")
    'github.com-user-repo'

    >>> get_repo_name("https://gerrit.fd.io/r/hc2vpp")
    'gerrit.fd.io-r-hc2vpp'
    """
    # Remove the protocol (http or https)
    remote = re.sub(r"^https?://", "", remote)
    # Remove the '.git' extension if present
    if remote.endswith(".git"):
        remote = remote[:-4]
    # Split by '/' and join with '-'
    parts = remote.strip().rstrip("/").split("/")
    return "-".join(parts)


def get_default_branch(repo_path: str) -> str:
    """Get the default branch of the repository.

    :param repo_path: The local path to the repository.
    :return: The default branch name.

    >>> get_default_branch(".")
    'main'
    """
    try:
        # pylint: disable=use-maxsplit-arg
        output = (
            subprocess.check_output(
                ["git", "-C", repo_path, "symbolic-ref", "refs/remotes/origin/HEAD"]
            )
            .decode("utf-8")
            .strip()
        )

        # Remove the 'refs/remotes/origin/' prefix to get the full branch name
        prefix = "refs/remotes/origin/"
        if output.startswith(prefix):
            return output[len(prefix) :]
        else:
            return "master"  # fallback if the output is unexpected
    except Exception:
        logger.warning(
            "Failed trying to get default branch for %s. Assuming repo is in detached mode (*)",
            repo_path,
        )
        return "*"


def get_local_repo(remote: str, repos_dir: str) -> str:
    """Get the local repository path.

    :param remote: The remote URL of the repository.
    :param repos_dir: The directory where the local repository is stored.
    :return: The full path to the local repository.

    >>> get_local_repo("https://github.com/user/repo.git", "/path/to/local/dir")
    '/path/to/local/dir/repo'
    """
    return os.path.join(repos_dir, get_repo_name(remote))


def is_valid_commit_hash(commit_hash: str) -> bool:
    """Check if the given commit hash is valid.

    :param commit_hash: The commit hash.
    :return: True if the hash is valid, False otherwise.

    >>> is_valid_commit_hash("7d2fd738dbbca7af5d0f9a7c942a51fd0f7c5c5f")
    True
    >>> is_valid_commit_hash('not so')
    False
    """
    return re.match(r"^[0-9a-f]{40}$", commit_hash) is not None


def is_valid_datetime(commit_datetime: str) -> bool:
    """Check if the given datetime string is valid.

    :param commit_datetime: The datetime string.
    :return: True if the datetime string is valid, False otherwise.

    >>> is_valid_datetime("2021-09-01T10:20:30+00:00")
    True
    >>> is_valid_datetime("2021-09-01 10:20:30+00:00")
    False
    """
    try:
        time.strptime(commit_datetime, "%Y-%m-%dT%H:%M:%S%z")
        return True
    except ValueError:
        return False


def clone_repo(remote: str, repos_dir: str) -> None | Literal[1]:
    """Clone the given remote repository to the specified local directory.

    :param remote: The remote URL of the repository.
    :param local_dir: The directory where the local repository will be stored.
    :raise E.CrowdGitError: If there's an error creating the local directory.
    :raise E.GitRunError: If there's an error running the 'git clone' command.
    """
    repo_path = get_local_repo(remote, repos_dir)

    if os.path.exists(repo_path):
        raise E.CrowdGitError(f"Error creating {repo_path}: not overwriting existing directory")

    try:
        if not os.path.exists(repo_path):
            os.makedirs(repo_path)

        logger.info("Cloning %s to %s", remote, repo_path)
        start_time = time.time()
        result = subprocess.run(
            ["git", "clone", remote, repo_path],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            input=b"\n",  # Simulate pressing Enter to bypass username prompt
        )
        end_time = time.time()

        if result.returncode != 0:
            error_message = result.stderr.decode("utf-8")
            if "Username for" in error_message or "Password for" in error_message:
                logger.warning("Skipping repository %s due to authentication requirement", remote)
                return 1
            else:
                raise E.GitRunError(remote, repo_path, error_message)

        logger.info(
            "Repository %s cloned successfully to %s in %d s (%.1f min)",
            remote,
            repo_path,
            int(end_time - start_time),
            (end_time - start_time) / 60,
        )
    except subprocess.CalledProcessError as e:
        raise E.GitRunError(remote, repo_path, e)


def store_bad_commits(commit_lines: str, repo_path: str):
    if not os.path.exists(BAD_COMMITS_DIR):
        os.makedirs(BAD_COMMITS_DIR)

    bad_commits_file = os.path.join(BAD_COMMITS_DIR, os.path.basename(repo_path)) + ".txt"

    if commit_lines.strip():
        logger.info("Storing bad commits in %s", bad_commits_file)
        with open(bad_commits_file, "a", encoding="utf-8") as fout:
            fout.write(commit_lines)
            fout.write("\n-------------\n")


def get_commits(
    repo_path: str,
    default_branch: str,
    new_only: bool = False,
    since: Optional[str] = None,
    until: Optional[str] = None,
    verbose: bool = False,
) -> List[Dict]:
    """Get the commits of the repository.

    :param repo_path: The local path to the repository.
    :param default_branch: The default branch name.
    :param new_only: If True, get only the new commits.
    :param since: The starting date to fetch commits (optional).
    :param until: The end date to fetch commits (optional).
    :return: A list of dictionaries containing commit information.
    :return: A list of dictionaries containing commit information. Each dictionary contains the
             following keys:
                - 'hash': The commit hash (str).
                - 'datetime': The commit date and time in ISO 8601 format (str).
                - 'author_name': The author's name (str).
                - 'author_email': The author's email (str).
                - 'committer_name': The committer's name (str).
                - 'committer_email': The committer's email (str).
                - 'is_main_branch': A boolean indicating if the commit is on the main branch.
                - 'is_merge_commit': A boolean indicating if the commit is a merge commit.
                - 'message': The commit message as a list of strings, where each string is a line
                             of the message.
    """
    logger.info("Extracting commits from %s", repo_path)
    if new_only:
        commit_range = f"..origin/{default_branch}"
    else:
        commit_range = f"origin/{default_branch}"

    # handling repos in detached mode
    if new_only and default_branch == "*":
        commit_range = f"..HEAD"
    elif not new_only and default_branch == "*":
        commit_range = f"HEAD"

    splitter = "--CROWD-END-OF-COMMIT--"

    git_log_command = [
        "git",
        "-C",
        repo_path,
        "log",
        commit_range,
        f"--pretty=format:%H%n%aI%n%an%n%ae%n%cI%n%cn%n%ce%n%P%n%d%n%B%n{splitter}",
    ]

    if since:
        git_log_command.append(f"--since={since}")
    if until:
        git_log_command.append(f"--until={until}")

    # Set core.abbrevCommit to false to avoid truncating commit messages
    subprocess.check_output(["git", "-C", repo_path, "config", "core.abbrevCommit", "false"])

    start_time = time.time()
    try:
        commits_output = (
            subprocess.check_output(git_log_command).decode("utf-8", errors="replace").strip()
        )
    except Exception as e:
        logger.error(
            "Failed trying to extract commits for %s with %s: \n%s",
            repo_path,
            " ".join(git_log_command),
            str(e),
        )
        return []

    end_time = time.time()

    if not commits_output:
        logger.info("Did not find any commit output in %s", repo_path)
        return []

    bad_commits = 0
    commits = []

    commits_texts = commits_output.split(splitter)
    if verbose:
        commits_iter = tqdm.tqdm(commits_texts, desc="Parsing commits")
    else:
        commits_iter = commits_texts

    for commit_text in commits_iter:
        commit_lines = commit_text.strip().splitlines()

        if len(commit_lines) < 8:
            bad_commits += 1
            store_bad_commits(commit_text, repo_path)
            continue

        if (len(commit_lines)) < 9:
            from pprint import pprint as pp

            pp(commit_lines)

        commit_hash = commit_lines[0]
        author_datetime = commit_lines[1]
        author_name = commit_lines[2]
        author_email = commit_lines[3]

        # Check for empty author email
        if author_email is None or author_email.strip() == "":
            bad_commits += 1
            store_bad_commits(commit_text, repo_path)
            continue

        commit_datetime = commit_lines[4]
        commit_datetime_obj = datetime.datetime.strptime(commit_datetime, "%Y-%m-%dT%H:%M:%S%z")
        if commit_datetime_obj > datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            days=1
        ):
            commit_datetime = author_datetime
        committer_name = commit_lines[5]
        committer_email = commit_lines[6]
        parent_hashes = commit_lines[7].split()
        if len(commit_lines) >= 9:
            ref_names = commit_lines[8].strip()
        else:
            ref_names = ""

        if len(commit_lines) >= 10:
            commit_message = commit_lines[9:]
        else:
            commit_message = ""

        if not (is_valid_commit_hash(commit_hash) and is_valid_datetime(commit_datetime)):
            logger.error(
                "Invalid commit data found: hash=%s, datetime=%s",
                commit_hash,
                commit_datetime,
            )
            bad_commits += 1
            store_bad_commits(commit_text, repo_path)
            continue

        is_merge_commit = len(parent_hashes) > 1
        is_main_branch = True

        commits.append(
            {
                "hash": commit_hash,
                "author_datetime": author_datetime,
                "author_name": author_name,
                "author_email": author_email,
                "committer_datetime": commit_datetime,
                "committer_name": committer_name,
                "committer_email": committer_email,
                "is_main_branch": is_main_branch,
                "is_merge_commit": is_merge_commit,
                "message": commit_message,
            }
        )

    logger.info(
        "%d commits (%s) extracted from %s in %d s (%1.f min), %d bad commits",
        len(commits),
        "new only" if new_only else "all",
        repo_path,
        int(end_time - start_time),
        (end_time - start_time) / 60,
        bad_commits,
    )

    return commits


def get_insertions_deletions(
    repo_path: str,
    default_branch: str,
    new_only: bool = False,
    since: Optional[str] = None,
    until: Optional[str] = None,
    verbose: bool = False,
) -> Dict[str, Dict]:
    """Get the insertions and deletions for each commit in the repository.

    :param repo_path: The local path to the repository.
    :param default_branch: The default branch name.
    :param new_only: If True, get insertions and deletions only for new commits.
    :param since: The starting date to fetch commits (optional).
    :param until: The end date to fetch commits (optional).
    :return: A dictionary with commit hash as key and a dictionary with keys
             insertions/deletions as value.
    """
    logger.info("Extracting insertions/deletions from %s", repo_path)
    if new_only:
        commit_range = f"..origin/{default_branch}"
    else:
        commit_range = f"origin/{default_branch}"

    # handling repos in detached mode
    if new_only and default_branch == "*":
        commit_range = f"..HEAD"
    elif not new_only and default_branch == "*":
        commit_range = f"HEAD"

    git_log_command = [
        "git",
        "-C",
        repo_path,
        "log",
        commit_range,
        "--pretty=format:%H",
        "--cc",
        "--numstat",
    ]

    if since:
        git_log_command.append(f"--since={since}")
    if until:
        git_log_command.append(f"--until={until}")

    # Set core.abbrevCommit to false to avoid truncating commit messages
    subprocess.check_output(["git", "-C", repo_path, "config", "core.abbrevCommit", "false"])

    start_time = time.time()
    try:
        commits_output = (
            subprocess.check_output(git_log_command).decode("utf-8", errors="replace").strip()
        )
    except:
        return {}

    end_time = time.time()

    if not commits_output:
        return {}

    bad_commits = 0
    changes = {}

    commits_texts = commits_output.split("\n\n")
    if verbose:
        commits_iter = tqdm.tqdm(commits_texts, desc="Extracting insertions/deletions")
    else:
        commits_iter = commits_texts

    for commit_text in commits_iter:
        commit_lines = commit_text.strip().splitlines()

        if len(commit_lines) < 2:
            bad_commits += 1
            store_bad_commits(commit_text, repo_path)
            continue

        commit_hash = commit_lines[0]
        if not is_valid_commit_hash(commit_hash):
            logger.error("Invalid insertions/deletions hash found: hash=%s", commit_hash)
            bad_commits += 1
            store_bad_commits(commit_text, repo_path)
            continue

        insertions_deletions = commit_lines[1:]
        insertions = 0
        deletions = 0

        for line in insertions_deletions:
            match = re.match(r"^(\d+)\s+(\d+)", line)
            if match:
                insertions += int(match.group(1))
                deletions += int(match.group(2))

        changes[commit_hash] = {"insertions": insertions, "deletions": deletions}

    end_time = time.time()

    logger.info(
        "Changes for %d commits (%s) extracted from %s in %d s (%.1f min), %d bad commits",
        len(changes),
        "new only" if new_only else "all",
        repo_path,
        int(end_time - start_time),
        (end_time - start_time) / 60,
        bad_commits,
    )

    return changes


# :prompt:get-new-commits
def get_new_commits(remote: str, repos_dir: str = REPOS_DIR, verbose: bool = False) -> List[Dict]:
    """Get new commits from the remote repository.
    :param remote: The remote repository URL.
    :param repos_dir: The local directory where repositories are stored (default: REPOS_DIR).
    :return: A list of dictionaries with commit data and insertion/deletion information.
             Each dictionary contains the following keys:
                - 'hash': The commit hash (str).
                - 'datetime': The commit date and time in ISO 8601 format (str).
                - 'author_name': The author's name (str).
                - 'author_email': The author's email (str).
                - 'committer_name': The committer's name (str).
                - 'committer_email': The committer's email (str).
                - 'is_main_branch': A boolean indicating if the commit is on the main branch.
                - 'is_merge_commit': A boolean indicating if the commit is a merge commit.
                - 'insertions': An integer with the number of insertions.
                - 'deletions': An integer with the number of deletions.
                - 'message': The commit message as a list of strings, where each string is a line
                             of the message.
    """
    repo_path = get_local_repo(remote, repos_dir)

    def _add_insertions_deletions(commits: List, insertions_deletions: Dict) -> List[Dict]:
        return [
            commit | insertions_deletions.get(commit["hash"], {"insertions": 0, "deletions": 0})
            for commit in commits
        ]

    if not os.path.exists(repo_path):
        # Clone the repo if it doesn't exist
        logger.info("Repo %s not existing locally", repo_path)
        result = clone_repo(remote, repos_dir)
        if result == 1:
            return []
        default_branch = get_default_branch(repo_path)
        insertions_deletions = get_insertions_deletions(
            repo_path, default_branch, new_only=False, verbose=verbose
        )

        new_commits = _add_insertions_deletions(
            get_commits(repo_path, default_branch, new_only=False, verbose=verbose),
            insertions_deletions,
        )
        return new_commits

    logger.info("Fetching %s", repo_path)
    # Fetch the remote changes without merging
    subprocess.run(
        ["git", "-C", repo_path, "fetch"],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    default_branch = get_default_branch(repo_path)
    new_commits = get_commits(repo_path, default_branch, new_only=True, verbose=verbose)
    insertions_deletions = get_insertions_deletions(
        repo_path, default_branch, new_only=True, verbose=verbose
    )

    if new_commits:
        subprocess.run(
            ["git", "-C", repo_path, "merge", f"origin/{default_branch}"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    else:
        logger.info("No new commits")

    return _add_insertions_deletions(new_commits, insertions_deletions)


def get_commits_since_until(
    remote: str, since: str, until: str, repos_dir: str = REPOS_DIR, verbose: bool = False
) -> List[Dict]:
    """Get commits from the remote repository since the given date until the given date."""

    repo_path = get_local_repo(remote, repos_dir)

    def _add_insertions_deletions(commits: List, insertions_deletions: Dict) -> List[Dict]:
        return [
            commit | insertions_deletions.get(commit["hash"], {"insertions": 0, "deletions": 0})
            for commit in commits
        ]

    if not os.path.exists(repo_path):
        raise KeyError("Repository doens't exist locally")

    default_branch = get_default_branch(repo_path)
    commits_since_until = get_commits(
        repo_path, default_branch, verbose=verbose, since=since, until=until
    )
    insertions_deletions = get_insertions_deletions(
        repo_path, default_branch, verbose=verbose, since=since, until=until
    )

    return _add_insertions_deletions(commits_since_until, insertions_deletions)


# :/prompt:get-new-commits


def main():
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Get commit data from Git repositories.")
    subparsers = parser.add_subparsers(dest="command")

    get_commits_parser = subparsers.add_parser("get-commits")
    get_commits_parser.add_argument("repo_path", help="Local path to the repository.")
    get_commits_parser.add_argument(
        "--new-only", action="store_true", help="Get only new commits."
    )
    get_commits_parser.add_argument("--since", help="Starting date to fetch commits.")
    get_commits_parser.add_argument("--until", help="End date to fetch commits.")

    get_insertions_deletions_parser = subparsers.add_parser("get-insertions-deletions")
    get_insertions_deletions_parser.add_argument("repo_path", help="Local path to the repository.")
    get_insertions_deletions_parser.add_argument(
        "--new-only", action="store_true", help="Get only new commits."
    )
    get_insertions_deletions_parser.add_argument("--since", help="Starting date to fetch commits.")
    get_insertions_deletions_parser.add_argument("--until", help="End date to fetch commits.")

    get_new_commits_parser = subparsers.add_parser("get-new-commits")
    get_new_commits_parser.add_argument("remote", help="Remote repository URL.")
    get_new_commits_parser.add_argument(
        "--local-dir",
        default=REPOS_DIR,
        help=(
            "Local directory to store the repository. "
            "Defaults to the REPOS_DIR environment variable, "
            f'or to "{DEFAULT_REPOS_DIR}" if that is not set up'
        ),
    )

    parser.add_argument("--output", required=True, help="Output JSON file to store the results.")

    args = parser.parse_args()

    if args.command == "get-commits":
        result = get_commits(
            args.repo_path,
            get_default_branch(args.repo_path),
            args.new_only,
            args.since,
            args.until,
        )
    elif args.command == "get-insertions-deletions":
        result = get_insertions_deletions(
            args.repo_path,
            get_default_branch(args.repo_path),
            args.new_only,
            args.since,
            args.until,
        )
    elif args.command == "get-new-commits":
        result = get_new_commits(args.remote, args.local_dir)
    else:
        parser.error("Invalid command")

    with open(args.output, "w", encoding="utf-8") as output_file:
        json.dump(result, output_file, indent=2)

    print(f"Results saved to {args.output}")


if __name__ == "__main__":
    main()
