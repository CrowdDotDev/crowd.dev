
# Journey of Data from CM to Insights
[This image](https://uploads.linear.app/aebec7ad-5649-4758-9bed-061f7228a879/b72d9f55-8f27-4c57-81fe-729807c12ffb/36c116c2-0f88-4735-a932-0c3e6bf8ea45) shows how data flows from CM to Insights. 

## Activity Preprocessing Pipeline

1. **New activities land** on `activities` and `activityRelations` datasources 
2. **Deduplication** of activities via copy pipe:  
   - `activities_deduplicated_copy_pipe (every hour at minute 0)`  
   2.1. `activities` → `activities_deduplicated_ds`  
3. **Preprocessing pipeline for activityRelations - Deduplicates, filters and sorts data for performant queries**:  
   - `activityRelations (every hour at minute 0)` → `activityRelations_deduplicated_cleaned_ds`

## Other Copy Pipes

1. **pull_request_analysis_copy_pipe (every hour at minute 15)**: Compacts activities from same PR into one, keeping state change times in the same row. Helps with serving PR related metrics 
2. **issue_analysis_copy_pipe (every hour at minute 15)**: Similar to pr analysis, this time we compact issue related information into one row.

---

## Making changes to resources
1. Install the **tb client** for classic tinybird
    - 1.1. Create a new virtual environment for pip `python3 -m venv .venv`
    - 1.2. Source the venv `source .venv/bin/activate`
    - 1.3. In this folder run `pip install -r requirements.txt`
    - 1.4 Check installation `tb --version` The version should be 5.x.x
2. Authenticate with tinybird using `tb auth`. You should use your personal token in tinybird.
3. Make sure you are pointing to the correct workspace by `tb workspace ls` and `tb workspace use`
4. Create new endpoints using the staging instance UI
5. Pull schema changes into code using `tb pull` while you're pointing to staging workspace
   1. You may need to use `tb pull --force` to overwrite the existing files, if your changes are not being fetched.
   2. You can also use `tb pull --match <resource_name>` to pull only specific resources.
   3. And you can use a combination of the two previous "tricks": `tb pull --force --match <resource_name>`.
6. Run `libs/tinybird/scripts/format_all.sh` so that our changes conform to the TinyBird format for our TB version.
7. Create PR for changes, make sure Tinybird-CI passes.
8. Once Changes are merged, now point to production instance and `tb push` the latest stuff.
   1. As before with `tb pull`, you may need to use `tb push /path/to/pipe --force` to overwrite the existing files, if your changes are not being pushed.

---

## How to Iterate on Data

ClickHouse is an **append-only** database, so **updates** aren't possible.  
Instead, we **reingest the data with new fields**, and let **deduplication** handle the rest.

👉  For **deduplication** to work properly, whenever we're updating something (either via ui, sql, or some script) the `updatedAt` fields should also be updated. This is the field that ClickHouse uses to decide which version it's going to use on deduplicating via `ReplacingMergeTree` engine.

### Iterating on Activity Fields

Since `activities` **don’t exist in Postgres**, schema iteration must be done **entirely on Tinybird**.
1. **Stop `data-sink-workers`** to prevent new data from arriving in the `activities` datasource.
2. **Update** `activity.datasource` schema in Tinybird to include the new field.
3. **Create a copy pipe**:
   - Source: existing `activity` datasource  
   - Destination: new datasource (e.g., `activities_new`)  
   - Copy pipe definition must populate the new field
4. Once the copy is **completed**:
   - **Delete** the old `activities` datasource  
   - **Rename** `activities_new` to `activities` (**see end note**)
5. **Restart** `data-sink-workers` with the updated code

---

### Iterating on Datasources Replicated by Sequin

These sources exist in Postgres (i.e., all Tinybird datasources **except `activities`**):

- `activityRelations`
- `collections`
- `insightsProjects`
- `collectionsInsightsProjects`
- `members`
- `organizations`
- `segments`
- `securityInsightsEvaluationSuiteControlEvaluations`
- `securityInsightsEvaluationSuiteControlEvaluationAssessments`

**Steps:**
1. **Pause** the related Sequin sink
2. **Run Postgres migration** to add/update/remove fields
3. **Update Tinybird schema**:
   - Delete and recreate the datasource (e.g., `members.datasource`) via `tb push` (**see end note**)
4. **Backfill** the resource from Sequin
5. **Restart** the paused sink


---

### Add new tables to sequin and tinybird

**Steps:**
1. Create the table in postgres (or skip if it already exists)
2. Add migration for the sequin publication to include tables
```sql   
ALTER PUBLICATION sequin_pub ADD TABLE "tableName";
ALTER TABLE public."tableName" REPLICA IDENTITY FULL;
```
3. (only for PROD) u need to create the topic in oracle kafka, it doesn't get created automaticly
4. Update tinybird kafka connect plugin env ( it's under crowd-kube/lf-prod-oracle(lf-staging-oracle)/kafka-connect/tinybird-sink.properties.enc ), there are list of tracked files in the decrypted file.
5. Restart kafka-connect
6. Create tinybird datasource schema and push it to tinybird
7. Add access to the table to sequin user in postgres
```sql
GRANT SELECT ON "tableName" to sequin;
```
8. Create sequin sinks for new tables
9. Create tinybird datasources
10. Backfill from sequin

---

### Downtime Consideration

Switching between old and new datasources can lead to **temporary downtime**, but only for **endpoint pipes that consume raw datasources directly**.

**No Downtime** if the endpoint pipe uses a **deduplication copy pipe**:
- You can safely remove the raw datasource
- The deduplicated datasource will continue to serve data
- New fields will be included in the **next copy run**

**Only consider the following tips if your pipe is consuming raw datasources directly**:

- **Downtime starts** when the old datasource is deleted
- **Downtime ends** when the new datasource is renamed to the old name

👉 It's important to **keep this switch as short as possible** to minimize disruption.

---

### Alternative Way to Handle Datasource Iterations

You can avoid downtime entirely by **not deleting the old datasource**.

Instead of renaming the new datasource to the old one,  
**Update each endpoint pipe to use the new datasource directly**

This allows your pipelines to stay active without interruption.

#### Pros:
- No downtime at all
- Safer testing of the new datasource before retiring the old one

#### Cons:
- Every pipe using the old datasource must be updated manually
- Easy to miss a reference if not done carefully

---

### Choosing the Right Approach

Until we move fully to **Tinybird Forward** (which will support migration scripts), the best practice is to **find a balance** between these two approaches:

1. **Quick rename strategy** is best when the raw datasource is only consumed by deduplication copy pipes, but no endpoints
2. **Pipe-by-pipe updates** for zero downtime where #1 is not enough

Pick the method that best fits your workflow and datasource complexity.

# Testing Tinybird Pipes Locally

This guide explains how to test a Tinybird data pipeline ("pipe") on your local Tinybird environment. We will fetch sample data (fixtures) from a staging Tinybird workspace and use it to run and verify a pipe locally. The steps below are written for a developer who may not be familiar with Tinybird, and they are organized in a clear, numbered format for easy follow-up.

## Prerequisites

- **Tinybird CLI and Local Environment:** Make sure you have the Tinybird CLI (`tb`) installed.  
  To start a local Tinybird instance, run the following Docker command:
  ```bash
  docker run --platform linux/amd64 -p 7181:7181 --name tinybird-classic-local     -e COMPATIBILITY_MODE=1 -d tinybirdco/tinybird-local:latest
  ```
  This will start Tinybird Local at `http://localhost:7181`.

- **Staging Workspace Access:** You need access to a Tinybird staging (or production) workspace with an API token that has permission to read data (we'll use it to export data).  
- **Project Files:** Ensure you have your Tinybird project files available locally – this includes the data source definitions and pipe (.pipe) files you plan to test. For example, if you plan to test a pipe that uses a data source named `insightsProjects`, you should have the corresponding `insightsProjects.datasource` file (or have created that data source) in your local workspace. Similarly, have the pipe file (e.g. `activities_filtered.pipe` and any related pipes) ready in your project directory.

## Steps to Test the Tinybird Integration Locally

1. **Set Up Environment Variables and Authenticate**  
   First, set up environment variables for both your local Tinybird instance and the staging environment, then authenticate using the Tinybird CLI. This will ensure the CLI is pointed to the correct environment when running commands. Replace `<YOUR_STAGING_TOKEN>` with your actual staging API token. The local admin token is retrieved via the local Tinybird API:
   ```bash
   # Set Tinybird local API endpoint and get the local admin token
   export TB_HOST_LOCAL="http://localhost:7181"
   TB_TOKEN_LOCAL="$(curl -s "$TB_HOST_LOCAL/tokens" | jq -r '.workspace_admin_token')"

   # Set Tinybird staging API endpoint and token (replace with your staging info)
   export TB_HOST_STAGING="https://api.us-west-2.aws.tinybird.co"   # use the correct region/domain for your case
   export TB_TOKEN_STAGING="<YOUR_STAGING_TOKEN>"
   ``` 

   Now use these variables to log in to the local and staging workspaces via the CLI:
   ```bash
   # Authenticate to local Tinybird workspace
   tb auth --host "$TB_HOST_LOCAL" --token "$TB_TOKEN_LOCAL"

   # Authenticate to staging Tinybird workspace
   tb auth --host "$TB_HOST_STAGING" --token "$TB_TOKEN_STAGING"
   ``` 
   **Note:** Only one workspace is active in the CLI at a time. The second `tb auth` command (staging) will switch the context to the staging workspace. You can run `tb workspace ls` at any time to see the list of workspaces and which one is currently active. Make sure to pay attention to this, as you will need to switch back to the local workspace after exporting the data.

2. **Export Fixture Data from Staging**  
   Next, fetch some sample data from the staging environment to use in your local test. We will use the Tinybird SQL API via a `curl` command to retrieve data. In this example, we select up to 200 rows from the `insightsProjects` data source in the staging workspace and save it to a local file:
   ```bash
   curl -s -H "Authorization: Bearer $TB_TOKEN_STAGING"         --data-urlencode "q=SELECT id, name, slug, description, segmentId, createdAt, updatedAt, deletedAt, logoUrl, organizationId, website, github, linkedin, twitter, widgets, repositories, enabled, isLF, keywords FROM insightsProjects LIMIT 200 FORMAT JSONEachRow"         "https://api.us-west-2.aws.tinybird.co/v0/sql"    | jq -c '{record: .}' > insightsProjects.ndjson
   ``` 

   ⚠️ check if this data is not already there in the `fixtures` folder. If not, place the output in the `fixtures` folder and push it.

3. **Switch Back to Local Workspace**  
   Now that we have the fixture data, we need to switch the Tinybird CLI context back to the local environment before importing data and pushing pipes:
   ```bash
   tb auth --host "$TB_HOST_LOCAL" --token "$TB_TOKEN_LOCAL"
   ``` 

4. **Import the Fixture Data into Local Datasource**  
   Append the data you downloaded to the corresponding data source in your local Tinybird workspace:
   ```bash
   tb datasource append insightsProjects --file insightsProjects.ndjson
   ``` 

5. **Push the Pipe to the Local Environment**  
   Push the Tinybird pipe you want to test into your local Tinybird workspace:
   ```bash
   tb push pipes/activities_filtered.pipe
   ``` 

6. **Test the Local API Endpoint**  
   Finally, call the pipe’s API endpoint on your local Tinybird instance to verify it works with the local data:
   ```bash
   curl -s "http://localhost:7181/v0/pipes/activities_count.json"         -G         --data-urlencode "project=umbertotest5"         --data-urlencode "token=$TB_TOKEN_LOCAL"
   ``` 

## Additional Tips

- If the `curl` request in step 6 returns an authentication error, double-check that you're using the correct token.
- You can iterate on your pipe queries locally and rerun the endpoint call to quickly test changes.
- Remember that any changes made locally (like new data or modified pipes) are not automatically reflected in the cloud workspace.
