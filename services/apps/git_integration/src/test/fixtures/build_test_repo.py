#!/usr/bin/env python3
"""
Build test git repository from seed file.

This script creates a git repository with commits defined in test_repo_seed.json.
The repository is used for testing commit and activity extraction.
"""

import json
import os
import subprocess
import sys
from pathlib import Path


def run_git_command(repo_path: str, command: list[str]) -> str:
    """Run a git command in the repository."""
    result = subprocess.run(command, cwd=repo_path, capture_output=True, text=True, check=True)
    return result.stdout.strip()


def initialize_repo(repo_path: str) -> None:
    """Initialize a new git repository."""
    if os.path.exists(repo_path):
        print(f"Repository already exists at {repo_path}")
        return

    os.makedirs(repo_path, exist_ok=True)
    run_git_command(repo_path, ["git", "init"])
    run_git_command(repo_path, ["git", "config", "user.name", "Test User"])
    run_git_command(repo_path, ["git", "config", "user.email", "test@example.com"])
    print(f"✅ Initialized git repository at {repo_path}")


def create_commit(repo_path: str, commit_data: dict) -> str:
    """Create a single commit from commit data."""
    author_name = commit_data["author"]["name"]
    author_email = commit_data["author"]["email"]
    message = commit_data["message"]

    # Get committer info (defaults to author if not specified)
    committer = commit_data.get("committer", commit_data["author"])
    committer_name = committer["name"]
    committer_email = committer["email"]

    # Create/modify files
    for file_data in commit_data["files"]:
        file_path = os.path.join(repo_path, file_data["path"])
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "w") as f:
            f.write(file_data["content"])

        # Stage the file
        run_git_command(repo_path, ["git", "add", file_data["path"]])

    # Set author and committer using minimal environment
    env = {
        "GIT_AUTHOR_NAME": author_name,
        "GIT_AUTHOR_EMAIL": author_email,
        "GIT_COMMITTER_NAME": committer_name,
        "GIT_COMMITTER_EMAIL": committer_email,
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),  # Minimal PATH for git command
    }

    subprocess.run(
        ["git", "commit", "-m", message],
        cwd=repo_path,
        capture_output=True,
        text=True,
        check=True,
        env=env,
    )

    # Get the commit hash
    commit_hash = run_git_command(repo_path, ["git", "rev-parse", "HEAD"])

    return commit_hash


def build_repository(seed_file: str, repo_path: str) -> dict:
    """Build git repository from seed file."""
    print(f"📖 Reading seed file: {seed_file}")

    with open(seed_file, "r") as f:
        seed_data = json.load(f)

    print(f"🏗️  Building repository at: {repo_path}")

    # Initialize repository
    initialize_repo(repo_path)

    # Create commits
    commit_hashes = []
    for i, commit_data in enumerate(seed_data["commits"], 1):
        commit_hash = create_commit(repo_path, commit_data)
        commit_hashes.append(commit_hash)
        print(f"✅ Created commit {i}/{len(seed_data['commits'])}: {commit_hash[:8]}")

    # Get repository statistics
    total_commits = run_git_command(repo_path, ["git", "rev-list", "--count", "HEAD"])

    print("\n🎉 Repository built successfully!")
    print(f"   Total commits: {total_commits}")
    print(f"   Location: {repo_path}")

    return {
        "repo_path": repo_path,
        "commit_hashes": commit_hashes,
        "total_commits": int(total_commits),
    }


def main():
    """Main entry point."""
    # Get script directory
    script_dir = Path(__file__).parent

    # Default paths
    seed_file = script_dir / "test_repo_seed.json"
    repos_dir = script_dir.parent / "repos"
    repos_dir.mkdir(exist_ok=True)
    repo_path = repos_dir / "test-repo"

    # Allow overriding from command line
    if len(sys.argv) > 1:
        seed_file = Path(sys.argv[1])
    if len(sys.argv) > 2:
        repo_path = Path(sys.argv[2])

    # Build repository
    result = build_repository(str(seed_file), str(repo_path))

    # Print result
    print("\n📊 Build Summary:")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
