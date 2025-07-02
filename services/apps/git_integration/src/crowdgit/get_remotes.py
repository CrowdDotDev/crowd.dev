# -*- coding: utf-8 -*-
"""get_remotes endpoint.

Defines the get_remotes function, which return a dictionary of remotes of the form:

{
  "kubernetes": [
    "remote_0_0",
    "remote_0_1",
    "remote_0_2"
  ],
  "linux": [
    "remote_1_0",
    "remote_1_1",
    "remote_1_2",
    "remote_1_3"
  ]
}

"""

import os
import requests

from crowdgit.logger import get_logger

logger = get_logger(__name__)


def get_remotes(host, api_key):
    protocol = "http" if "localhost" in host else "https"
    url = f"{protocol}://{host}/api/git"
    payload = {}
    headers = {"Authorization": f"Bearer {api_key}"}

    response = requests.request("GET", url, headers=headers, data=payload, timeout=10)

    if response.status_code == 200:
        return response.json()

    logger.error("Request to get remotes failed with status code %s", response.status_code)
    return {}


def main():
    from pprint import pprint
    from crowdgit import load_env

    load_env()

    pprint(
        get_remotes(
            os.environ["CROWD_HOST"],
            os.environ["TENANT_ID"],
            os.environ["CROWD_API_KEY"],
        )
    )


if __name__ == "__main__":
    main()
