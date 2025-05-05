
# Journey of Data from CM to Insights
[This image](https://uploads.linear.app/aebec7ad-5649-4758-9bed-061f7228a879/b72d9f55-8f27-4c57-81fe-729807c12ffb/36c116c2-0f88-4735-a932-0c3e6bf8ea45) shows how data flows from CM to Insights. 

## Activity Preprocessing Pipeline

1. **New activities land** on `activities` and `activityRelations` datasources 
2. **Deduplication** of activities and relations separately via copy pipes:  
   - `activities_deduplicated_copy_pipe (every hour at minute 0)`  
   - `activityRelations_deduplicated_copy_pipe (every hour at minute 0)`  
   2.1. `activities` → `activities_deduplicated_ds`  
   2.2. `activityRelations` → `activityRelations_deduplicated_ds`  
3. **Merging with relations, filtering and sorting data**:  
   - `activityRelations_deduplicated_ds (every hour at minute 10)` + `activities_deduplicated_ds` → `activities_with_relations_sorted_deduplicated_ds`

## Other Copy Pipes

1. **pull_request_analysis_copy_pipe (every hour at minute 15)**: Compacts activities from same PR into one, keeping state change times in the same row. Helps with serving PR related metrics 
2. **issue_analysis_copy_pipe (every hour at minute 15)**: Similar to pr analysis, this time we compact issue related information into one row.

---

## Creating new endpoints
1. Install the **tb client** for classic tinybird
    - 1.1. Create a new virtual environment for pip `python3 -m venv .venv`
    - 1.2. Source the venv `source .venv/bin/activate`
    - 1.3. In this folder run `pip install -r requirements.txt`
    - 1.4 Check installation `tb --version` The version should be 5.x.x
2. Authenticate with tinybird using `tb auth`. You should use your personal token in tinybird.
3. Make sure you are pointing to the correct workspace by `tb workspace ls` and `tb workspace use`
4. Create new endpoints using the staging instance UI
5. Pull schema changes into code using `tb pull` while you're pointing to staging workspace
6. Create PR for changes, make sure Tinybird-CI passes.
7. Once Changes are merged, now point to production instance and `tb push` the latest stuff.

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
