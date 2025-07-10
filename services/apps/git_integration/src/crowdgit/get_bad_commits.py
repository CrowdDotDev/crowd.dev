from git import Repo, Git
from pprint import pprint as pp
import os
import requests
import json
from tqdm import tqdm
from crowdgit.ingest import Queue
from dotenv import load_dotenv
import time


def send_api_call(endpoint, body=None, method="POST"):
    load_dotenv()

    CROWD_API_KEY = os.getenv("CROWD_API_KEY")
    CROWD_HOST = os.getenv("CROWD_HOST")
    TENANT_ID = os.getenv("TENANT_ID")
    protocol = "http" if "localhost" in CROWD_HOST else "https"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {CROWD_API_KEY}"}

    url = f"{protocol}://{CROWD_HOST}/api/tenant/{TENANT_ID}/{endpoint}"

    try:
        if method == "POST":
            response = requests.request(
                method, url, headers=headers, data=json.dumps(body), timeout=30
            )
        else:
            response = requests.request(method, url, headers=headers, timeout=30)
        if response.status_code != 200:
            pp(body)
            raise Exception(
                f"Request failed with status code {response.status_code}, error: {response.text}"
            )
        return response.json()
    except Exception as e:
        print("Exception", e)
        print("Method", method)
        print("Body", body)
        return False


def get_commit_info(repo, segment_id, integration_id, remote, commit_id, repo_path="."):
    try:
        commit = repo.commit(commit_id)
    except Exception as e:
        print(f"Error: {e}")
        return

    # Author's name
    author_name = commit.author.name

    # Author's email
    author_email = commit.author.email

    # Title of the commit
    title = commit.message.split("\n")[0]

    # Body of the commit
    body = "\n".join(commit.message.split("\n")[1:])

    # datetime of the commit in UTC
    datetime_utc = commit.authored_datetime

    # timezone of the commit
    timezone = str(commit.authored_datetime.astimezone().tzinfo)

    # extract insertions and deletions
    g = Git(repo_path)
    try:
        stats = g.execute(["git", "diff", "--numstat", commit_id + "^", commit_id]).split("\n")[
            :-1
        ]
    except Exception as e:
        print(f"Error: {e}")
        return
    insertions, deletions = 0, 0
    for stat in stats:
        ins, del_, _ = stat.split("\t")
        insertions += int(ins)
        deletions += int(del_)

    activity = {
        "sourceId": commit_id,
        "timestamp": datetime_utc.isoformat(),  # Convert datetime to ISO 8601 format
        "body": body,
        "title": title,
        "type": "authored-commit",
        "channel": remote,
        "platform": "git",
        "isContribution": True,
        "attributes": {
            "insertions": insertions,
            "deletions": deletions,
            "lines": insertions + deletions,
            "isMerge": len(commit.parents)
            > 1,  # Determines if the commit is a merge by checking the number of parents
            "api": True,
            "isMainBranch": True,
            "timezone": timezone,
        },
        "member": {
            "identities": [
                {
                    "platform": "git",
                    "username": author_name if author_name else author_email,
                }
            ],
            "emails": [author_email],
            "displayName": author_name if author_name else author_email,
        },
        "segments": [segment_id],
    }

    queue = Queue()

    return queue.send_messages(segment_id, integration_id, [activity])


def parse_commit_file(commit_file_path, repo_path):
    with open(commit_file_path, "r") as f:
        commit_data = f.read()

    commits = commit_data.split("-------------\n")
    commits = [commit.replace("-", "").strip() for commit in commits if commit.strip()]

    repo = Repo(repo_path)
    remote = repo.remotes.origin.url
    endpoint = "git"

    print(f"Processing {remote}")

    response_data = send_api_call(endpoint, {}, method="GET")

    segment_id = None
    integration_id = None
    for id, data in response_data.items():
        if remote in data["remotes"]:
            segment_id = id
            integration_id = data["integrationId"]
            break

    if segment_id is None:
        print("No segment")
        return

    bad_commits = []
    for commit in tqdm(commits):
        commit_id = commit.split("\n")[0]
        commit_info = get_commit_info(
            repo, segment_id, integration_id, remote, commit_id, repo_path
        )
        if not commit_info:
            bad_commits.append(commit_id)
    return bad_commits


def main():
    import glob
    from crowdgit import LOCAL_DIR

    commit_files = glob.glob(f"{LOCAL_DIR}/bad-commits/[!DONE]*.txt")
    for commit_file_path in commit_files:
        repo_path = f"{LOCAL_DIR}/repos/" + os.path.basename(commit_file_path).replace(".txt", "")
        parse_commit_file(commit_file_path, repo_path)
        os.rename(
            commit_file_path,
            f"{LOCAL_DIR}/bad-commits/DONE_"
            + time.strftime("%Y%m%d")
            + "_"
            + os.path.basename(commit_file_path),
        )


if __name__ == "__main__":
    main()
