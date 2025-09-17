import asyncio
import re
from urllib.parse import urlparse

from crowdgit.errors import (
    CommandExecutionError,
    CommandTimeoutError,
    DiskSpaceError,
    NetworkError,
    PermissionError,
    ValidationError,
)
from crowdgit.logger import logger


def parse_repo_url(repo_url: str):
    """
    Parse repository url and returns owner and repo_name
    """
    parsed_url = urlparse(repo_url)
    path_parts = parsed_url.path.strip("/").split("/")

    if len(path_parts) >= 2:
        return path_parts[:2]
    raise ValidationError("Failed to get owner and repo_name from repo_url")


def get_repo_name(remote: str) -> str:
    """
    Get the domain and path segments from the remote URL and join them with '-'.

    Args:
        remote: The remote URL of the repository.

    Returns:
        The domain and path segments joined by '-', without the '.git' extension.

    Examples:
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


async def get_default_branch(repo_path: str) -> str:
    """Get the default branch of the repository using local repo

    Args:
        repo_path: The local path to the repository.

    Returns:
        The default branch name.
    """

    try:
        output = await run_shell_command(
            ["git", "-C", repo_path, "symbolic-ref", "refs/remotes/origin/HEAD"]
        )

        # Remove the 'refs/remotes/origin/' prefix to get the full branch name
        prefix = "refs/remotes/origin/"
        if output.startswith(prefix):
            return output[len(prefix) :]
    except CommandExecutionError:
        pass

    # Fallback: check which common branches exist locally as remote tracking branches
    for branch in ["master", "main"]:
        try:
            await run_shell_command(
                ["git", "-C", repo_path, "show-ref", "--verify", f"refs/remotes/origin/{branch}"]
            )
            return branch
        except CommandExecutionError:
            continue

    # Final fallback: detached mode
    logger.warning(f"No remote tracking branches found for {repo_path}, assuming detached mode")
    return "*"


async def run_shell_command(
    cmd: list[str],
    cwd: str = None,
    timeout: float | None = None,
    input_text: str | bytes | None = None,
) -> str:
    """
    Run shell command asynchronously and return output on success, raise exception on failure.

    Args:
        cmd: Command and arguments
        cwd: Working directory
        timeout: Command timeout in seconds
        input_text: Text (str) or bytes to send to stdin (will automatically append newline if not present)

    Returns:
        str: Command stdout output

    Raises:
        CommandTimeoutError: When command times out
        DiskSpaceError: When disk space is insufficient
        NetworkError: When network connectivity issues occur
        PermissionError: When permission is denied
        CommandExecutionError: For other command failures
    """
    process = None
    command_str = " ".join(cmd)
    try:
        # Create subprocess with stdin pipe if input is provided
        if input_text is not None:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                stdin=asyncio.subprocess.PIPE,
            )
        else:
            process = await asyncio.create_subprocess_exec(
                *cmd, cwd=cwd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )

        # Prepare input if provided
        stdin_input = None
        if input_text is not None:
            # Handle both string and bytes input
            if isinstance(input_text, bytes):
                # If input is already bytes, ensure it ends with newline
                if not input_text.endswith(b"\n"):
                    input_text += b"\n"
                stdin_input = input_text
            else:
                # If input is string, ensure it ends with newline then encode
                if not input_text.endswith("\n"):
                    input_text += "\n"
                stdin_input = input_text.encode("utf-8")

        # Wait for completion with optional timeout
        if timeout:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(input=stdin_input), timeout=timeout
            )
        else:
            stdout, stderr = await process.communicate(input=stdin_input)

        stdout_text = stdout.decode("utf-8").strip() if stdout else ""
        stderr_text = stderr.decode("utf-8").strip() if stderr else ""

        # Check return code
        if process.returncode == 0:
            return stdout_text

        if "No space left on device" in stderr_text:
            logger.error(f"Disk space error: {stderr_text}")
            raise DiskSpaceError(f"Disk space error while running: {command_str}")
        elif any(
            pattern in stderr_text
            for pattern in ["Network is unreachable", "Connection refused", "Connection timed out"]
        ):
            logger.warning(f"Network error: {stderr_text}")
            raise NetworkError(f"Network error while running: {command_str}")
        elif "Permission denied" in stderr_text:
            logger.error(f"Permission error: {stderr_text}")
            raise PermissionError(f"Permission denied while running: {command_str}")
        else:
            logger.error(f"Command error: {stderr_text}")
            raise CommandExecutionError(f"Command failed: {command_str} - {stderr_text}")

    except asyncio.TimeoutError:
        logger.error(f"Command timed out after {timeout}s: {command_str}")
        # Kill the process if it's still running
        if process and process.returncode is None:
            process.kill()
            await process.wait()
        raise CommandTimeoutError(f"Command timed out after {timeout}s: {command_str}") from None
