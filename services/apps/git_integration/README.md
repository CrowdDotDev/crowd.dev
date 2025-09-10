# CM Git integration - OUTDATED and need to be updated!

The Git integration differs from most other integrations because the data is local-first. The goal is to get contributor information from commits in a repo.
The way it is configured, there is only one Git integration allowed per deployment. This is enough since LF has its deployment.
The Git integration lives in its own EC2 instance. It will get a set of remotes, clone them, parse activities and members from them, and send them back to crowd.dev. Because we need to use our queue systems to ingest data, the instance must have access to the VPC where the cluster lives.

## Getting started

### Environment
There are some environment variables needed for this integration to work. They are stored in the [Git integration environment repo](https://github.com/CrowdDotDev/git-integration-environment/tree/main) for staging and production.

Expected environment variables:

- `CROWD_HOST`: the URL to use to send requests to crowd.dev.
- `TENANT_ID`: the tenant in crowd.dev that will have the integration.
- `CROWD_API_KEY`: the API key for the user in crowd.dev setting up the integration.
- `SQS_ENDPOINT_URL`: the endpoint URL to send messages for ingesting activities.
- `SQS_REGION`: the region in which the SQS queue lives.
- `SQS_SECRET_ACCESS_KEY`: secret access key for the account that has the SQS.
- `SQS_ACCESS_KEY_ID`: the id for the account that has the SQS.


### Install

```
mkdir ~/venv/cgit && python -m venv ~/venv/cgit
source ~/venv/cgit/bin/activate
pip install --upgrade pip
pip install -e .
pip install ".[dev]"
```

## The integration

### Getting remotes

The remotes, which are the repos to clone, come from the database. We set up a normal integration that stores the remotes in the `settings`. This can be done through the UI.

To get remotes, we can do so with a simple request:
```
import requests

url = "{host}/api/tenant/{TENANT_ID}/git"

payload = {}
headers = {
  'Authorization': 'Bearer {CROWD_API_KEY}'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)
```

### What data do we get from a commit?

A commit can have multiple activities within. For example, this is how a fairly complex commit might look:

- **Hash**: `7b50567bdcad8925ca1e075feb7171c12015afd1`
- **Author** 
    - **Name**: `Arnd Bergmann`
    - **Email**: `arnd@arndb.de`
- **Date**: `2023-02-07 17:13:12+01:00`
- **Committer**:
    - **Name**: `Linus Torvalds`
    - **Email**: `torvalds@linux-foundation.org`
    - **Date**: `2023-03-31 16:10:04-07:00`
- **Message:** 
```
*Body here…
Signed-off-by: Arnd Bergmann arnd@arndb.de
Reported-by: Guenter Roeck linux@roeck-us.net
Reported-by: Sudip Mukherjee sudipm.mukherjee@gmail.com
Reviewed-by: Manivannan Sadhasivam mani@kernel.org
Reviewed-by: Laurent Pinchart laurent.pinchart@ideasonboard.com
Signed-off-by: Linus Torvalds torvalds@linux-foundation.org
```

### The integration's flow
The integration runs every hour; there is a cron job set up.

- Retrieve the required remotes from crowd.dev. For each remote:
    - Use a semaphore to check if parsing for a repository is in progress:
        - If not running, proceed with the process.
        - If running, skip to the following repository.
    - Set the repository semaphore to "running."
    - Update an existing cloned repository by pulling new commits or clone it to get all commits if it's not already cloned.
    - Process each commit:
        - Extract and save activities and members from the commit to a list.
    - If the repository is a GitHub repository, attempt to fetch the contributor's GitHub information based on the commit's SHA.
    - With a list containing activities and members:
        - Split the list into chunks and forward them to the nodejs_worker for ingestion via SQS.
    - Remove the semaphore from the repository.


### File breakdown

- `get_remotes.py`: it gets a list of all the repository remotes we need in the integration.
- `repo.py`: performs several functions related to repos. Clones, extracts commits (and new commits since a date), gets insertions and deletions for a commit...
- `activity.py`: gets the activities that we need from a commit. It uses the activitymap.py file as a helper.
- `ingest.py`: this is the main controller file. It gets the remotes, ensures the repos are cloned, gets new activities from the commits, and sends SQS messages for ingestions.

## Deployment and remote access

### Accessing the instances
The instances are easily accessible through SSH. Contact [Joan](mailto:joan@crowd.dev) for credentials.

### Deploying new versions

To deploy new versions, ssh into the instance, check out the `git-integration` directory, and pull. If you need to update environment variables, once you are inside the `git-integration` directory do:

- `./install.sh` if you are in staging
- `./install.sh prod` if you are in production

## Scripts

There are two useful scripts to re-onboard repos. These do not live in this repository, they are in the root of the production instance (for now). 

- `reonboard.sh`: Given a remote URL, it will perform a full re-onboard of the commits for that repository. This always starts from scratch, because it deletes and re-clones the repo.
- `reonboard-all.sh`: It will re-onboard all repositories. This only performs a full re-onboard for the repos that did not exist in the instance already. Therefore, if we have to stop the script halfway through for some reason, we can re-start it and it without a problem.
