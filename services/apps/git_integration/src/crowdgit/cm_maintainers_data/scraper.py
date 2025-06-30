import os
import base64
from dotenv import load_dotenv
from crowdgit.cm_maintainers_data.bedrock import invoke_bedrock
from crowdgit.cm_maintainers_data.enums import ScraperError
import json
from tqdm import tqdm
from prettytable import PrettyTable
from crowdgit import LOCAL_DIR
from crowdgit.repo import get_local_repo, get_repo_name
from crowdgit.logger import get_logger
from datetime import datetime
import subprocess
from pydantic import BaseModel
from typing import Optional, List, Literal
from threading import Lock

lock = Lock()


logger = get_logger(__name__)

load_dotenv()

DEFAULT_REPOS_DIR = os.path.join("..", "..", LOCAL_DIR, "repos")
REPOS_DIR = os.environ.get("REPOS_DIR", DEFAULT_REPOS_DIR)


class MaintainerFile(BaseModel):
    file_name: Optional[str] = None
    error: Optional[str] = None


class MaintainerInfoItem(BaseModel):
    github_username: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    normalized_title: Optional[Literal["maintainer", "contributor"]] = None


class MaintainerInfo(BaseModel):
    info: Optional[list[MaintainerInfoItem]] = None
    error: Optional[str] = None


class AggregatedMaintainerInfoItems(BaseModel):
    info: List[MaintainerInfoItem]


class AggregatedMaintainerInfo(BaseModel):
    output: AggregatedMaintainerInfoItems
    cost: float


class ScrapeResult(BaseModel):
    maintainer_file: Optional[str] = None
    maintainer_info: Optional[List[MaintainerInfoItem]] = None
    total_cost: float = 0
    failed: Optional[bool] = False
    reason: Optional[ScraperError] = None


class ScrapeUpdateResult(BaseModel):
    output: Optional[AggregatedMaintainerInfo]
    last_modified: Optional[datetime] = None


# List of common maintainer file names
maintainer_files = [
    "MAINTAINERS",
    "MAINTAINERS.md",
    "MAINTAINER.md",
    "CODEOWNERS.md",
    "CONTRIBUTORS",
    "CONTRIBUTORS.md",
    "docs/MAINTAINERS.md",
    "OWNERS",
    "CODEOWNERS",
    ".github/MAINTAINERS.md",
    ".github/CONTRIBUTORS.md",
]


def check_for_updates(file_name: str, owner: str, repo: str, last_run_at: datetime):
    remote_url = f"https://github.com/{owner}/{repo}.git"
    local_repo = get_local_repo(remote_url, REPOS_DIR)

    file_path = os.path.join(local_repo, file_name)
    dir_name = get_repo_name(remote_url)
    repo_dir = os.path.join(REPOS_DIR, dir_name)

    if os.path.exists(file_path):
        last_run_at_str = last_run_at.strftime("%Y-%m-%d %H:%M:%S")
        cmd = (
            f"git -C {repo_dir} log -1 --since='{last_run_at_str}' --format=%H:%ct -- {file_name}"
        )
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if result.stdout.strip():
            _, commit_timestamp = result.stdout.strip().split(":")
            last_modified = datetime.fromtimestamp(int(commit_timestamp))
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            decoded_content = base64.b64encode(content.encode()).decode("utf-8")
            result = analyze_file_content(decoded_content)
            return ScrapeUpdateResult(
                output=result,
                last_modified=last_modified,
            )
    return None


# Function to check for maintainer files
def find_maintainer_file(owner: str, repo: str):
    remote_url = f"https://github.com/{owner}/{repo}.git"
    local_repo = get_local_repo(remote_url, REPOS_DIR)

    if not os.path.exists(local_repo):
        logger.error(f"Local repo {local_repo} does not exist")
        raise KeyError(f"Local repo {local_repo} does not exist")

    logger.info(f"Checking for maintainer files in {owner}/{repo}...")

    file_names = os.listdir(local_repo)

    for file in maintainer_files:
        file_path = os.path.join(local_repo, file)
        if os.path.isfile(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            return file, base64.b64encode(content.encode()).decode(), 0

    logger.info("\nNo maintainer files found using the known file names.")

    logger.info("\nUsing AI to find maintainer files...")
    file_name, ai_cost = find_maintainer_file_with_ai(file_names, owner, repo)

    if file_name:
        file_path = os.path.join(local_repo, file_name)
        if os.path.isfile(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            logger.info(f"\nMaintainer file found: {file_name}")
            return file_name, base64.b64encode(content.encode()).decode(), ai_cost

    return None, None, ai_cost


def update_stats(file_name, owner, repo):
    with lock:
        stats_file = os.path.join(LOCAL_DIR, "ai-found-file-stats.json")
        if os.path.exists(stats_file):
            with open(stats_file, "r") as f:
                stats = json.load(f)
        else:
            stats = {}

        if file_name not in stats:
            stats[file_name] = []
        repo_identifier = f"{owner}/{repo}"
        if repo_identifier not in stats[file_name]:
            stats[file_name].append(repo_identifier)

        with open(stats_file, "w") as f:
            json.dump(stats, f, indent=2)


def find_maintainer_file_with_ai(file_names, owner, repo):
    instructions = (
        "You are a helpful assistant.",
        "You are given a list of file names from a GitHub repository.",
        "Your task is to determine if any of these files are a maintainer file.",
        "If a maintainer file is found, return the file name as {file_name: <file_name>}",
        "If no maintainer file is found, return {error: 'not_found'}.",
        "If the list of files is empty, return {error: 'not_found'}.",
        "The file is never CONTRIBUTING.md"
        "As an example, this is the kind of files you are looking for:",
        "{EXAMPLE_FILES}" "Here is the list of file names and their contents:",
        "{FILE_NAMES}",
    )
    replacements = {"EXAMPLE_FILES": maintainer_files, "FILE_NAMES": file_names}
    result = invoke_bedrock(instructions, pydantic_model=MaintainerFile, replacements=replacements)

    if result.output.file_name is not None:
        file_name = result.output.file_name
        update_stats(file_name, owner, repo)
        return file_name, result.cost
    else:
        return None, result.cost


def analyze_file_content(content: str):
    instructions = (
        "Analyze the following content from a GitHub repository file and extract maintainer information.",
        "The information should include GitHub usernames, names, and their titles or roles if available.",
        "If GitHub usernames are not explicitly mentioned, try to infer them from the names or any links provided.",
        "Present the information as a list of JSON objects.",
        "Each JSON object should have 'github_username', 'name', 'title' and 'normalized_title' fields.",
        "The title field should be a string that describes the maintainer's role or title,",
        "it should have a maximum of two words,",
        "and it should not contain words that do not add information, like 'repository', 'active', or 'project'.",
        "The title has to be related to ownershop, maintainership, review, governance, or similar. It cannot be Software Engineer, for example.",
        "The 'normalized_title' field should be either maintainer or contributor, nothing else.",
        "Select the most appropriate 'normalized_title for each maintainer given all the info.",
        "If a GitHub username can't be determined, use 'unknown' as the value.",
        "If you canot find any maintainer information, return {error: 'not_found'}",
        "If the content is not talking about a person, rather a group or team (for example config.yaml @LFDT-Hiero/lf-staff), return {error: 'not_found'}",
        "Here is the content to analyze:",
        "{CONTENT}."
        "Present the information as a list of JSON object in the following format:{info: <list of maintainer info>}, or {error: 'not_found'}",
        "The output should be a valid JSON array, directly parseable by Python.",
    )

    if len(content) > 5000:
        chunks = []
        while content:
            split_index = content.rfind("\n", 0, 5000)
            if split_index == -1:
                split_index = 5000
            chunks.append(content[:split_index])
            content = content[split_index:].lstrip()

        aggregated_info = AggregatedMaintainerInfo(
            output=AggregatedMaintainerInfoItems(info=[]), cost=0
        )
        for i, chunk in enumerate(chunks, 1):
            chunk_info = invoke_bedrock(
                instructions, pydantic_model=MaintainerInfo, replacements={"CONTENT": chunk}
            )
            if chunk_info.output.info is not None:
                aggregated_info.output.info.extend(chunk_info.output.info)
            aggregated_info.cost += chunk_info.cost
        maintainer_info = aggregated_info
    else:
        maintainer_info = invoke_bedrock(
            instructions, pydantic_model=MaintainerInfo, replacements={"CONTENT": content}
        )

    try:
        if maintainer_info.output.info is not None:
            return AggregatedMaintainerInfo(
                output=AggregatedMaintainerInfoItems(info=maintainer_info.output.info),
                cost=maintainer_info.cost,
            )
        elif maintainer_info.output.error == "not_found":
            return AggregatedMaintainerInfo(
                output=AggregatedMaintainerInfoItems(info=None), cost=maintainer_info.cost
            )
        else:
            raise ValueError(
                "Expected a list of maintainer info or an error message, got: "
                + str(maintainer_info)
            )
    except ValueError:
        raise ValueError("Failed to analyze the maintainer file content.")


# Function to display maintainer info in a table
def display_maintainer_info(info: list[MaintainerInfoItem]):
    table = PrettyTable()
    table.field_names = ["GitHub Username", "Name", "Title/Role"]
    table.align = "l"
    for item in info:
        username = item.github_username or "unknown"
        name = item.name or "N/A"
        role = item.title or item.role or "N/A"
        table.add_row([username if username != "unknown" else "N/A", name, role])
    logger.info("\n%s", table)


def scrape_updates(file_content):
    decoded_content = base64.b64decode(file_content).decode("utf-8")
    result = analyze_file_content(decoded_content)
    maintainer_info = result.output.info
    cost = result.cost
    if maintainer_info is None:
        logger.error("Failed to analyze the maintainer file content.")
        return {"failed": True, "reason": ScraperError.ANALYSIS_FAILED, "cost": cost}
    return {
        "maintainer_info": maintainer_info,
        "cost": cost,
    }


# Main logic
def scrape(owner: str, repo: str):
    total_cost = 0

    try:
        file_name, file_content, ai_cost = find_maintainer_file(owner, repo)
        total_cost += ai_cost
    except KeyError:
        return ScrapeResult(
            total_cost=total_cost,
            failed=True,
            reason=ScraperError.LOCAL_REPO_NOT_FOUND,
        )

    if not file_name or not file_content:
        return ScrapeResult(
            total_cost=total_cost,
            failed=True,
            reason=ScraperError.NO_MAINTAINER_FILE,
        )

    decoded_content = base64.b64decode(file_content).decode("utf-8")

    logger.info(f"Analyzing maintainer file: {file_name}")
    result = analyze_file_content(decoded_content)
    maintainer_info = result.output.info
    total_cost += result.cost

    if not maintainer_info:
        logger.error("Failed to analyze the maintainer file content.")
        return ScrapeResult(
            total_cost=total_cost,
            failed=True,
            reason=ScraperError.ANALYSIS_FAILED,
        )

    return ScrapeResult(
        maintainer_file=file_name,
        maintainer_info=maintainer_info,
        total_cost=total_cost,
    )


if __name__ == "__main__":
    owner = "keylime"
    repo = "keylime"

    result = scrape(owner, repo)
    if result.maintainer_info is not None:
        print("Maintainer info:", result.maintainer_info)
    elif result.failed:
        logger.error(f"Failed to scrape {owner}/{repo}: {result.reason}")
    if result.total_cost is not None:
        logger.info(f"Total cost: ${result.total_cost:.6f}")
