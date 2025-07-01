# -*- coding: utf-8 -*-

import re
import hashlib
import time
from typing import List, Dict
from datetime import datetime
import os
import json

import requests
import tqdm
from fuzzywuzzy import process

import dotenv

dotenv.load_dotenv(".env")

from crowdgit.repo import get_repo_name, get_new_commits, get_commits_since_until
from crowdgit.activitymap import ActivityMap

from crowdgit.logger import get_logger

logger = get_logger(__name__)


def match_activity_name(activity_name: str) -> str:
    best_match = process.extractOne(activity_name, ActivityMap.keys(), score_cutoff=80)
    return best_match[0] if best_match else None


def extract_activities_fuzzy(
    commit_message: List[str],
) -> List[Dict[str, Dict[str, str]]]:
    activities = []
    activity_pattern = re.compile(r"([^:]*):\s*(.*)\s*<(.*)>")

    for line in commit_message:
        match = activity_pattern.match(line)
        if match:
            activity_name, name, email = match.groups()
            matched_key = match_activity_name(activity_name.lower())
            if matched_key:
                for activity in ActivityMap[matched_key]:
                    activities.append({activity: {"name": name.strip(), "email": email.strip()}})
    return activities


# :prompt:extract-activities
def extract_activities(commit_message: List[str]) -> List[Dict[str, Dict[str, str]]]:
    """
    Extract activities from the commit message and return a list of activities.
    Each activity in the list includes the activity and the person who made it,
    which in turn includes the name and the email.

    :param commit_message: A list of strings, where each string is a line of the commit message.
    :return: A list of dictionaries containing activities and the person who made them.

    >>> extract_activities([
    ...     "Signed-off-by: Arnd Bergmann <arnd@arndb.de>",
    ...     "reported-by: Guenter Roeck <linux@roeck-us.net>"
    ... ]) == [{'Signed-off-by': {'email': 'arnd@arndb.de', 'name': 'Arnd Bergmann'}},
    ...        {'Reported-by': {'email': 'linux@roeck-us.net', 'name': 'Guenter Roeck'}}]
    True
    """
    activities = []
    activity_pattern = re.compile(r"([^:]*):\s*(.*?)\s+<{1,2}([^>]+)>+$")

    for line in commit_message:
        match = activity_pattern.match(line)
        if match:
            activity_name, name, email = match.groups()
            activity_name = activity_name.strip().lower()
            if activity_name in ActivityMap:
                name = name.strip()
                email = email.strip()
                for activity in ActivityMap[activity_name]:
                    activities.append({activity: {"name": name, "email": email}})
    return activities


def clean_up_username(name: str):
    name = re.sub(r"(?i)Reviewed[- ]by:", "", name)
    name = re.sub(r"(?i)from:", "", name)
    name = re.sub(r"(?i)cc:.*", "", name).strip()
    return name.strip()


# pylint: disable=too-many-branches
def prepare_crowd_activities(
    remote: str,
    commits: List[Dict] | None = None,
    verbose: bool = False,
    since: str | None = None,
    until: str | None = None,
) -> List[Dict]:
    def create_activity(
        commit: Dict,
        activity_type: str,
        member: Dict,
        source_id: str,
        source_parent_id: str = "",
    ) -> Dict:
        # if this is an "author" activity, the source_parent_id is ''
        if source_parent_id == "":
            timestamp = commit["author_datetime"]
        else:
            timestamp = commit["committer_datetime"]
        dt = datetime.fromisoformat(timestamp)

        # Check if username or displayName is None, an empty string, or not an actual name
        if not member["username"]:
            member["username"] = member["emails"][0]
        if not member["displayName"]:
            member["displayName"] = member["emails"][0].split("@")[0]

        member["username"] = clean_up_username(member["username"])
        member["displayName"] = clean_up_username(member["displayName"])

        return {
            "type": activity_type,
            "timestamp": timestamp,
            "sourceId": source_id,
            "sourceParentId": source_parent_id,
            "platform": "git",
            "channel": remote,
            "body": "\n".join(commit["message"]),
            "isContribution": True,
            "attributes": {
                "insertions": commit.get("insertions", 0),
                "timezone": dt.tzname(),
                "deletions": commit.get("deletions", 0),
                "lines": commit.get("insertions", 0) - commit.get("deletions", 0),
                "isMerge": commit["is_merge_commit"],
                "isMainBranch": True,
            },
            "url": remote,
            "member": member,
        }

    activities = []

    if commits is None and since is None and until is None:
        commits = get_new_commits(remote, verbose=verbose)
    elif commits is None and (since is not None or until is not None):
        commits = get_commits_since_until(remote, since, until, verbose=verbose)

    if verbose:
        commits_iter = tqdm.tqdm(commits, desc="Processing commits")
    else:
        commits_iter = commits

    for commit in commits_iter:
        activities_to_add = []
        author = {
            "username": commit["author_name"],
            "displayName": commit["author_name"],
            "emails": [commit["author_email"]],
        }
        committer = {
            "username": commit["committer_name"],
            "displayName": commit["committer_name"],
            "emails": [commit["committer_email"]],
        }

        # Add authored-commit activity
        activities_to_add.append(
            create_activity(commit, "authored-commit", author, commit["hash"])
        )

        # Add committed-commit activity if the committer is different from the author
        activities_to_add.append(
            create_activity(
                commit,
                "committed-commit",
                committer,
                hashlib.sha1(
                    (commit["hash"] + "commited-commit" + commit["committer_email"]).encode(
                        "utf-8"
                    )
                ).hexdigest(),
                commit["hash"],
            )
        )

        # Extract and add other activities
        extracted_activities = extract_activities(commit["message"])
        for extracted_activity in extracted_activities:
            activity_type, member_data = list(extracted_activity.items())[0]
            activity_type = activity_type.lower().replace("-by", "") + "-commit"

            member = {
                "username": member_data["email"],
                "displayName": member_data["name"],
                "emails": [member_data["email"]],
            }

            source_id = hashlib.sha1(
                (commit["hash"] + activity_type + member_data["email"]).encode("utf-8")
            ).hexdigest()
            activities_to_add.append(
                create_activity(commit, activity_type, member, source_id, commit["hash"])
            )

        activities += activities_to_add

    # For the new processing of activities
    for activity in activities:
        activity["member"]["identities"] = [
            {
                "platform": activity["platform"],
                "value": activity["member"]["emails"][0],
                "type": "username",
                "verified": True,
            }
        ] + [
            {
                "platform": activity["platform"],
                "value": email,
                "type": "email",
                "verified": False,
            }
            for email in activity["member"]["emails"]
        ]

        del activity["member"]["username"]
        del activity["member"]["emails"]

    return activities


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Extract activities from commit messages.")
    parser.add_argument(
        "input_file", help="Input JSON file containing the list of commit dictionaries."
    )
    parser.add_argument(
        "output_file", help="Output JSON file containing the extracted activities."
    )
    parser.add_argument(
        "--crowd-activities",
        action="store_true",
        help="Enable extraction of crowd activities from commit messages.",
    )
    parser.add_argument(
        "--remote",
        default="",
        help="Remote repository URL for the extracted crowd activities.",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose output.")
    args = parser.parse_args()

    with open(args.input_file, "r", encoding="utf-8") as input_file:
        commits = json.load(input_file)

    output_data = None
    start_time = time.time()

    if args.crowd_activities:
        if not args.remote:
            print("Error: The --remote argument is required when using --crowd-activities.")
            return

        output_data = prepare_crowd_activities(args.remote, commits, verbose=args.verbose)
    else:
        activities_by_commit = {}
        for commit in tqdm.tqdm(commits, desc="Processing commits"):
            commit_hash = commit["hash"]
            commit_message = commit["message"]
            activities = extract_activities(commit_message)
            activities_by_commit[commit_hash] = activities
        output_data = activities_by_commit

    end_time = time.time()
    logger.info(
        "%d activities extracted in %d s (%.1f min)",
        len(output_data),
        int(end_time - start_time),
        (end_time - start_time) / 60,
    )

    with open(args.output_file, "w", encoding="utf-8") as output_file:
        json.dump(output_data, output_file, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
