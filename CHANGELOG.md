# Changelog

All notable changes to this project will be documented in this file.

## v0.23.0 - 2023-03-14

### Changes

You can see the whole changelog in [our changelog](https://changelog.crowd.dev/changelogs/fast-members-query-and-simple-onboarding)

#### 🚀 Features

- New onboarding @gaspergrom (#607)

#### ✨ Improvements

- Optimized the members' query @themarolt (#643)
- New approach to handle sample data in frontend @joanagmaia (#646)
- New approach to handle sample data in the backend @joanreyero (#641)
- Allow sorting of Eagle Eye feed @joanagmaia (#630)
- Move Eagle Eye settings to the top @gaspergrom (#623)
- Added an Eagle Eye pricing plan @epipav (#645)
- Update the pricing page with Eagle eye @joanagmaia (#642)
- Tweak the copy in the Eagle Eye pricing page @joanreyero (#644)

#### 🐞 Bug Fixes

- Fix regex in Safari that caused the page to not show @gaspergrom (#647)
- Fix Eagle Eye's drawers and thumbnail width @gaspergrom (#638)
- Fixed type issues in the quickstart guides @gaspergrom (#635)
- Getting all installed repos for GitHub, with pagination @epipav (#628)
- Added pagination to the member's search component @joanagmaia (#621)

## v0.22.0 - 2023-03-07

### Changes

For the full changelog, see: [changelog.crowd.dev](http://changelog.crowd.dev/)

### :sparkles: Improvements

- Eagle-eye onboarding flow @gaspergrom (#578)
- Moved user management to free tier @joanreyero (#599)
- Added an alerting (both to the user and internal) for faulty integrations @joanreyero (#616)
- Admin tool based on Slack commands @themarolt (#613)
- Allow editing multi select fields @joanagmaia (#593)
- Allow to re-enrich members @joanagmaia (#594)
- Added `isOrganization` as a default attribute for members @epipav (#605)
- Allow to open members in a new tab @gaspergrom (#577)
- Add limit to autocomplete member's dropdown @joanagmaia (#587)
- Replace partners logos @joanagmaia (#581)

### 🐞 Bug Fixes

- Fix of member's emails not being updated @joanreyero (#598)
- Remove members that are organizations from members list @joanagmaia (#600)
- Fix formbricks integration @joanagmaia (#619)
- Search filter initial value setting @gaspergrom (#603)
- Show multiple organizations in members profile @joanagmaia (#608)
- Add waiting approval status @gaspergrom (#601)
- Cascading to member enrichment cache on member delete @epipav (#588)
- Fix Slack channels duplicated activities @themarolt (#582)

## v0.21.0 - 2023-02-28

### New changelog

This week we are introducing a new changelog: [changelog.crowd.dev](https://changelog.crowd.dev). From now on, GitHub changelogs will include only one-line bullet points listing the pull requests that were merged during the week. A link to the fully detailed changelog will be added to each GitHub changelog.

### Changes

#### :rocket: Features

- Home rebuild @gaspergrom (#560)

#### :sparkles: Improvements

- Allow configuring which attributes are visible on the members' page @joanagmaia (#572)
- Allow merging of two members when they are selected in the members' list @gaspergrom (#573)
- Allow the user to duplicate custom reports @gaspergrom (#571)
- Rendering of Slack emojis @gaspergrom (#566)
- Allow un-marking members as team members @joanagmaia (#565)
- Show an autocomplete when updating a member's organizations @joanagmaia (#561)
- Moved feature flags to Unleash @themarolt (#553)

#### :ladybug: Bug Fixes

- Fixed filtering members by username on any platform @joanreyero (#580)
- Sentiment exceptions result in an empty sentiment object instead of an error @epipav (#579)
- Allow all-time range in cumulative measures @epipav (#576)
- Hide organizations without members in the organizations' query endpoint @epipav (#570)
- Fixed the fuzzy match in the Hacker News integration @joanreyero (#564)
- Fix issues when unpublishing documents in the community help center @epipav (#563)
- Removed trial label from organizations page @themarolt (#559)
- Fix the `guildId` being passed incorrectly in the Discord integration sometimes @themarolt (#558)
- Handling when a user has no followers on the Twitter integration @themarolt (#585)
- Handling of no mentions returned in the Twitter integration. @themarolt (#584)
- Save Twitter refresh tokens after refreshing for debugging purposes @themarolt (#583)

## v0.20.0 - 2023-02-20

### Changes

#### 🚀 Features

##### Eagle Eye 2.0

Introducing Eagle Eye 2.0: a better way to grow your developer tool by engaging with relevant content.

With a refreshed user interface and several new features, Eagle Eye 2.0 will help you find and and engage with the perfect content in your niche.

![41cac97ad013228d74bf737c4b87372e](https://user-images.githubusercontent.com/37874460/220153970-e2642f81-fd37-4d01-9a69-838c263f96f9.png)

###### Revamped User Interface

We have redesigned the user interface to make setting up your feed and discovering relevant content easier.

https://user-images.githubusercontent.com/37874460/220165561-1e158a47-421a-4d7a-b353-b56bf2e945ab.mp4

###### More Platforms

EagleEye now supports 12 of the most relevant platforms for developer tools. You can now access content from Reddit, GitHub discussions, Tweets, Medium posts, StackOverflow questions, DEV and Hacker News posts, YouTube videos, Producthunt discussions, Kaggle discussions, and Hashnode articles.

###### Better Search

We have improved the search algorithm to give you more relevant results. You can now exclude certain keywords from your search, enabling you to tailor your results further.

###### Email Digest

Stay up-to-date with your Eagle Eye feed by configuring an email digest that delivers a daily summary of your content. This feature will help you to make growth a daily routine.

<img src="https://user-images.githubusercontent.com/37874460/220158597-7178802e-eef9-493c-a7d8-ac39a9040945.png"  width="400">
###### AI Replies
Eagle Eye 2.0 also offers a new AI-powered feature that generates suggested replies for your content.
https://user-images.githubusercontent.com/37874460/220165717-4204605a-260f-41cb-acca-1bdf5747f6aa.mp4
- Eagle Eye 2.0 @epipav @joanagmaia @gaspergrom @nunoeufrasio @jonathimer @joanreyero (#495)

#### Improvements

- Moved the Discord integration to use web sockets for scalability. @themarolt (#486)
- Add Formbricks Product-Market-Fit widget. @mattinannt (#467)

#### 🐞 Bug Fixes

- Added missing identity forms when editing members. @joanreyero (#543)
- Filtering out team members in the *Active members* widget on the home page. @joanreyero (#541)
- When members are merged, the new member gets the highest of the two scores. @joanreyero (#542)
- Fix a message duplication issue when a Discord server has both crowd.dev apps connected @themarolt (#538)
- Preventing rapid-fire of the same messages over discord websockets @themarolt (#532)
- Fix Export to CSV functionality @joanagmaia (#533)

## v0.19.0 - 2023-02-13

### Changes

### ✨ Improvements

- Added LinkedIn to sample data @joanreyero (#481)
- Moved the organizations' module to the essential plan @themarolt (#514)

### 🐞 Bug Fixes

- Fix global attributes not showing in the Edit attributes drawer. @joanagmaia (#488)
- Fix filters for custom attributes. @joanagmaia (#492)
- Fix the reach filter on the members' page. @joanagmaia (#491)
- Share button visible on custom reports page @gaspergrom (#484)

## v0.18.0 - 2023-02-06

### Changes

### 🚀 Features

#### Member enrichment

Introducing our member enrichment feature! With it you can populate your community's developer profiles with over 25 additional data points, including social information from various platforms, technical skills, programming languages, and a network graph of their open-source contributions.

<img width="1727" alt="Member enrichment 1 (1)" src="https://user-images.githubusercontent.com/37874460/217013465-198132f3-1895-49a6-a2a5-2651878a6bc6.png">
<img width="1727" alt="Member enrichment 2 (1)" src="https://user-images.githubusercontent.com/37874460/217013513-c8b0244d-1c54-4aa3-9826-6ae53d53bf74.png">
- Member enrichment @joanreyero (#452)
- Added a contributions column to members @joanreyero (#439)
- Replaced isEnriched (bool) by lastEnriched (timestamp) @joanreyero (#436)
- Added the special type for member attributes @joanreyero (#431)
- Multi-select attribute type for members @joanreyero (#426)
- Tweak error messages when enriching in bulk @joanagmaia (#477)
#### Detailed report drawers
You can now get a detailed view of the members returned by widgets in default reports. For example, you can see exactly which members were active this month, as well as the total count.
<img width="860" alt="Screenshot 2023-02-06 at 16 34 00" src="https://user-images.githubusercontent.com/37874460/217014619-f2b3b0ff-b25e-457b-9206-7793998b7a23.png">
- Report detailed drawers @joanagmaia (#461)
- Find active members endpoint @themarolt (#449)
### ✨ Improvements
- Optimizations in the LinkedIn integration. @themarolt (#464)
- Show organization logos and image comments for the LinkedIn integration. @themarolt (#451)
- Prevent the same integration from being processed multiple times at once. @themarolt (#471)
- Hide activity from bot users. @mariobalca (#465)
- Re-designed weekly analytics report. @epipav (#446)
### 🐞 Bug Fixes
- Fix TypeScript errors and add a check in the CI. @themarolt (#480)
- Add receipt history for weekly report emails. @epipav (#479)
- Fix some member attributes being non-existent. @epipav (#476)
- Disable the filter button in custom reports for unsupported measures .@joanagmaia (#466)
- Fix a bug related to Discord's *joined guild* activity. @themarolt (#462)
## v0.17.0 - 2023-01-23

### Changes

### 🚀 Features

#### LinkedIn integration

Introduction the LinkedIn integration! With it, you can bring the comments and reactions to your organization's LinkedIn posts into crowd.dev. This integration is only available for Growth and Custom plans.

<img width="1727" alt="Linkedin" src="https://user-images.githubusercontent.com/37874460/214154195-3e3ba24e-ba70-4eae-9f65-c22f3bd9042e.png">
- Linkedin integration @mariobalca (#442)
### ✨ Improvements
- Add global filters to Default Reports. @joanagmaia (#425)
- Added a Stripe integration for payment so we can automatically upgrade new Growth workspaces. @epipav (#419)
- Show the current date's value differently in reports. @joanagmaia (#443)
- Make the email independent from the identities in the members' list. @joanagmaia (#440)
- Refactor the UI of public reports. @joanagmaia (#437)
- Remove activities performed by team members. @epipav (#427)
### 🐞 Bug Fixes
- Fix a bug that kept redirecting from `auth/signup` to `augh/signin`. @themarolt (#445)
- Fix an error when unpublishing conversations in bulk. @epipav (#438)
- Modified the Community help center's `robots.txt` so Google will index it again. @epipav (#434)
- Fix URLs in organizations @joanagmaia (#430)
- Add the Job Title to the members list view @mariobalca (#428)
## v0.16.0 - 2023-01-16
### Changes

### 🚀 Features

#### Template reports

Introducing our newest feature: Default Reports! These specially crafted reports are designed to give you a deep dive into the inner workings of your community. With absolutely no setup required on your end, you can now access valuable insights about your members, including a breakdown of your active members, a comparison of new vs returning active members, and a list of your top engaged members.

- Members reports @joanagmaia (#418)
- Default reports backend updates @epipav (#398)
- Fix home dashboard and reports @joanagmaia (#424)

<img width="1727" alt="Reports 1" src="https://user-images.githubusercontent.com/37874460/212732237-8e46b294-8d60-433a-b76b-a3f45c1bf895.png">
#### Formbricks feedback
Our first external code contribution! @mattinannt and the [Formbricks](https://formbricks.com/) team added an in-app feedback box to our menu. If you have an idea, something needs to be fixed, or want to point out which features you like, you can leave us feedback there!
<img width="200" alt="Screenshot 2023-01-16 at 14 04 37" src="https://user-images.githubusercontent.com/37874460/212684851-8edd5ee7-1f40-4b48-9556-78190249707e.png">
- Add formbricks feedback @mattinannt (#411)
### ✨ Improvements
- Added the capability of filtering members by the types of activities they performed. @joanreyero (#421)
- Introduced WebSockets for 2-way communication between the frontend and backend. We will be using this to improve the UX of several features. @themarolt (#413)
- Installed Pendo so we can show new features within the app. @joanreyero (#406)
- Add a placeholder for mobile screens that asks the user to sign up from a bigger one. @joanagmaia (#414)
### 🐞 Bug Fixes
- Fixed a typo in the upgrade button @epipav (#409)
- Every time Twitter is connected, call the integration service in *onboarding* mode. @themarolt (#412)
- Fixed a bug where the user invite dialog disappeared almost immediately after inviting. @joanreyero (#415)
- Truncate the tenant name in the workspace dropdown when needed. @mariobalca (#410)
- Wrong hash was generated for star activities, which caused deduplication issues. @epipav (#407)
- Github integration service should handle github settings not being available @themarolt (#408)
- Fixed a bug in EagleEye that was causing exact keyword matching to crash @joanreyero (#416)
## v0.15.0 - 2023-01-09

### Changes

### Features

#### Exact keyword matching for EagleEye

You can now look for posts by an exact keyword in EagleEye. If you send a query wrapped in quotes, we will look for it exactly rather than performing semantic search.

For example, imagine you want to search for content that talks about *generatice AI*, but that mentions *Stable Diffusion*. You could send the query: `generative ai, "stable diffusion"`.

<img width="1067" alt="Screenshot 2023-01-09 at 13 14 50" src="https://user-images.githubusercontent.com/37874460/211305723-24aec737-7edf-4c4d-bcd4-deab5e64a968.png">
- EagleEye exact keyword matching @mariobalca @joanreyero (#383)
#### Discord forum channels
Forum channels are now supported as part of the Discord integration. We will get posts and all comments on those channels. If you already have a Discord integration connected, we will get posts in public forum channels automatically. You'll need to add the bot to the forum channels that you want if they are private.
- Get forum channels from Discord @joanreyero (#405)
### ✨ Improvements
- Preventing that an automation is executed twice. @themarolt (#401)
- Improved copy for tooltips in widgets. @epipav (#392)
### 🐞 Bug Fixes
- Fix a bug where members could be merged twice. @joanagmaia (#402)
- Do not throw an error when a GitHub webhook with an unsupported event type comes. @themarolt (#397)
- Hashtags were not being saved in the Twitter integration. @joanreyero (#396)
- Engagement score was weighing too much activities at the beginning of the month. @joanreyero (#394)
- Make sure that the text we send to AWS Comprehend for sentiment analysis is not too big. @joanreyero @themarolt (#391)
- Fix an edge case where merging members with similar activities was throwing a 500 error. @epipav (#388)
- Get GitHub user emails with GitHub app token instead of a user token. @themarolt (#389)
## v0.14.0 - 2023-01-02

### Changes

### 🚀 Features

#### CSV exports

You can now export your community members as CSV. You can export all members or choose any view to export, and we will send you a document in your email containing all the members that match the filter.

<img width="672" alt="Screenshot 2023-01-02 at 18 47 18" src="https://user-images.githubusercontent.com/37874460/210264594-2f744e43-2b31-4be7-aa28-6f0a6c9dbad5.png">
- Members CSV exports @epipav (#356)
### ✨ Improvements
- Team members and bots (as well as their activities) are now exported by default from reports. @epipav (#360)
- Add an error handler in the frontend to report errors. @joanagmaia (#382)
- Remove the *Connect integration* suggested task when the workspace already has an integration. @joanagmaia (#381)
- Add paywalls for the Community Help Centre and CSV exports @mariobalca (#380)
- Add members *joinedAt* column and filter to all views on the member's page. @joanagmaia (#374)
- Update the call to action layout when a workspace is in the trial. @joanagmaia (#371)
- When a Kubernetes pod is restarted while performing a job, retake the job when the pod is back up. @themarolt (#365 and #368)
- Update the logos and images on the app. @joanagmaia (#367)
### 🐞 Bug Fixes
- Fixed the sorting in the *Most engaged* view on the member's page. @joanagmaia (#375)
- Fix the missing label when assigning tasks to colleagues. @mariobalca (#379)
- Fix creating members with email only. @mariobalca (#377)
- Fix the *joined at* filter for organizations throwing an error. @joanagmaia (#378)
- Fix the pre-selection of a member when creating tasks from the member's profile. @joanagmaia (#373)
- Update the "Read more" URL for custom integrations. @dende (#372)
- Notes and tasks were being unlinked when updating tags in a member. @joanreyero (#370)
- Fix the sorting in the dashboard's *active members* widget. @joanagmaia (#369)
## v0.13.0 - 2022-12-19
### Changes
### 🚀 Features
#### Reddit integration
The Reddit integration is finally here! It was one of the most wanted integrations, and we have delivered. You can now track the posts and comments in your community's subreddit.

![Reddit (2) (1)](https://user-images.githubusercontent.com/37874460/208475828-a1e62b3c-6196-48bb-a362-4281630107a0.png)

- Reddit integration @mariobalca and @joanreyero (#351)

#### Plan page

We are advancing in making premium plans possible. This week we introduced a *Plan* page in the workspace's settings. You can use it to upgrade your plan to Growth, our first premium plan. You can learn more about our pricing [here](https://crowd.dev/pricing).

<img width="1055" alt="Screenshot 2022-12-19 at 17 53 44" src="https://user-images.githubusercontent.com/37874460/208478358-6c861f46-51bc-4db6-ba9f-23d7d5435a04.png">
- Plan page @joanagmaia (#350)
- Organizations paywall @joanagmaia (#357)
### ✨ Improvements
- Improve the user experience of connecting an integration by sending an email when the connection has succeeded. @mariobalca (#341)
- Tweaks grid and container-sized on all pages to adapt them to different screen sizes better. @mariobalca (#355)
- Do not show the engagement level for team members in the members' list, as it does not make sense. @joanreyero (#349)
- Added the infrastructure so we can display a banner with in-app TypeForm surveys. @joanreyero (#348)
### 🐞 Bug Fixes
- Add a missing interaction to the *Trial* tag. @joanagmaia (#366)
- Tenants created after the 18th of December only had a trial for 14 days. It should be until the 15th of January. @joanreyero (#363)
- Fix EagleEye's API throwing a 500 when sending posts to exclude @joanreyero (#359)
- Proxy requests to PostHog from frontend through an internal URL to avoid being blocked by the client. @epipav (#358)
- Fix a copy in the pricing page @joanagmaia (#353)
- Fix a copy error in the Hacker News integration's connection page. @jonathimer (#343)
## v0.12.0 - 2022-12-13
### Changes
- Fix identities for hackernews integration @joanagmaia (#313)
### 🚀 Features
#### Pricing and feature flagging
We are getting ready to make pricing possible so we can continue building crowd.dev for you. This week we introduced our infrastructure for pricing. You can check the full pricing details on our [website](https://crowd.dev/pricing). All tenants have been set to a free trial of the growth plan, which lasts until the 15th of January. After that, you will need to get a subscription to access the growth features.

With this, we have introduced feature flagging, so we can also roll out features gradually, with more testing and performance.

- Integrate posthog in frontend @joanagmaia (#335)
- Tenant plans and feature flagging @epipav (#318)

### ✨ Improvements

- Upped thresholds for merge suggestions and included `email` and `displayName` in the computation @joanreyero (#336)
- Add a search button to EagleEye to avoid making too many requests. Before, we searched every time there was a keyword change, causing performance issues. @mariobalca (#321)
- Render markdown in activities that have a markdown-based body @joanagmaia (#310)
- Decreased the pre-aggregation frequency in Cube.js to 10 minutes @epipav (#342)

### 🐞 Bug Fixes

- Remove the *index attributes* call when creating a document in Meilisearch @epipav (#346)
- Better logging for the Python Eagle Eye API for debugging purposes @joanreyero (#316)
- Fix type when trimming members' emails @epipav (#347)
- Preserve the old member email when doing an `upsert` if we receive an empty string from an integration @themarolt (#345)
- Fix the *related member* input showing blank when updating or creating a task @joanagmaia (#337)
- Twitter integration: stop processing hashtags if there are no posts with such hashtag @themarolt (#327)
- Detect which channel a Discord thread started from @themarolt (#322)
- Fix the increment in number-type metrics in the dashboard @joanagmaia (#326)
- Move Qdrant to the cloud version for better performance @joanreyero (#320)
- Exclude our internal tenants from telemetry, and add telemetry events for organizations and integrations @joanreyero (#317)
- Make sure that we call AWS Comprehend API with a `utf-8` string. @themarolt (#315)
- Properly handle GitHub's rate limit @themarolt (#311)

## v0.11.0 - 2022-12-05

### Changes

### 🚀 Features

#### Hacker News integration

The Hacker News integration will detect any post that mentions your community in the *Top* or *Best* of Hacker News. It works for any post published after the 1st of December 2022. The post will become a community activity, and so will any comment on those posts.

- Eagle Eye optimization and Hacker News integration @joanreyero (#267)

<img width="1195" alt="Screenshot 2022-12-05 at 18 28 56" src="https://user-images.githubusercontent.com/37874460/205703080-12358262-f798-49d3-9940-1757e6e2dfe4.png">
### ✨ Improvements
- Better accuracy in Eagle Eye for Hacker News suggestions @joanreyero (#267)
### 🐞 Bug Fixes
- Fix the pagination parameter when getting members from Twitter @joanreyero (#312)
- Removed the `# activities >= 1000` filter from the Organizations' *New and Active* view @joanreyero (#308)
- Sanitize the name attribute when enriching an organization with GitHub @epipav (#296)
- Fix several UX issues in the reports module @joanagmaia (#301 and #303)
- Fix rate limit handling in the Twitter integration @themarolt (#292 and #293)
- When moving a widget in a report, save its new position when it is dropped instead of moved to avoid a *too many requests error* @joanreyero (#295)
- Disable range filters in the frontend if one value is empty @joanagmaia (#290)
## v0.10.1 - 2022-11-30
### Changes
This release introduces three new features: organizations, tasks, and notes. Furthermore, we added a bunch of bug fixes and improvements based on your feedback.
### :rocket: Features
#### Organizations
You can now track how organizations are adopting your community. With the organizations' list, you can have an overview of all organizations. You can also have several views and perform filtering. For each organization, there is an organization page with all its background information, a list of all the members that belong to the organization, and their activities.
<img width="700" alt="Organizations" src="https://user-images.githubusercontent.com/37874460/204589538-65a46d85-ec91-488a-9b32-45f48fe53a94.png">
#### Tasks
With the new tasks feature you can create tasks related to your community members. Do you want to ask newcomers for feedback? Or influential members for some recognition? Or an unhappy member how can you make their life easier? You can orchestrate all this with your team using tasks. We support all standard to-do features, like assigning them to colleagues and setting due dates. You can read more in our [tasks docs](https://docs.crowd.dev/docs/tasks).
<img width="700" alt="Tasks" src="https://user-images.githubusercontent.com/37874460/204589346-6172b211-76fc-427c-9be2-9f5859756088.png">
#### Notes

The notes module allows you to add notes to your community members. You can annotate your chats with the member and leave comments for your colleagues. Oh, and we support markdown!

### Bug fixes and improvements

The feedback has been tremendous after our open-source launch! We have spent this month working on many bug fixes and improvements to make the app better every single day.

## v0.9.0 - 2022-10-31

### Changes

:fire: A brand-new user interface.
We completely overhauled our design and user experience (you may not even recognize the app). crowd.dev is now much more intuitive to use, and the product feels more polished.

<img width="1103" alt="Screenshot 2022-10-28 at 15 51 31" src="https://user-images.githubusercontent.com/37874460/198659098-cf43074c-1607-41a5-adf7-47635e247639.png">
:bust_in_silhouette: Richer member profiles
Member profiles now show you everything you need to know about an individual in one place, with even richer information on their activity history, tags, engagement level, and much more.
:man-man-boy-boy: Information on represented organizations
We now show you the total organizations that have been identified in your community, we also update you on any new organizations that are popping up in your community, as well as show you all the active organizations (organizations where members have been active in a given time period). Expect standalone pages for organizations very soon.
:dart:  Powerful filters, sorts, and views
Our new powerful filters, sorts and views instantly help you to segment, research, and understand your community more effectively. We have included default views, for example, “slipping away” to identify valuable members that may need some extra attention or “influential” to find individuals with high reach.
:thermometer: Sentiment analysis
We’ve built a model to conduct sentiment analysis for all activities in your community to show you how members are feeling, so you can take informed actions.
:love_letter: Trending conversations
We help you keep track of all conversations going on in your community, now, we also show you the ones that are trending and pulling a lot of engagement.
:hammer_and_wrench: Custom attributes and identities
Use our custom attribute function to add specific to you details as well as extra identities for your members beyond their community profiles (e.g., you can add identities using their phone number or extra email).
:key: Social Sign in with Google
We’ve added social sign-in to make signing up and logging into [crowd.dev](http://crowd.dev/) a breeze. You can now use your Google account.
#### Breaking changes
This version introduces breaking API changes. While the API has vastly improved and it is now much more powerful, previous scripts written with the API will need to be adjusted. For more information, refer to the [API docs](https://docs.crowd.dev/reference).
## v0.8.0 - 2022-10-07
### Changes
### ✨ Enhancements
- New Architecture: Serverless plus a static backend has been replaced by a Kubernetes cluster. (#53)
- Tweak error handling in DEV integration. Give a proper error when an organization / profile was not found @mariobalca (#65)
### 🐞 Bug Fixes
- Fix handler for webhooks coming from GitHub in the new Kubernetes architecture @themarolt (#68)
- The *new conversations* data-point in weekly emails not uses the first activity time, rather than time of creation @epipav (#64)
- Copy tweak in Dashboard @joanreyero (#63)
- Fix SQL Alchemy not connecting in Kubernetes in Python @joanreyero (#72)

## v0.7.0 - 2022-09-16

### Changes

### 🚀 Features

- Automations feature @mariobalca (#49) and @themarolt (#43)
- We now support webhooks as the first tool in our automations feature.
- This means you can now set up a webhook automation to be triggered:
- 
- - When a new member is detected
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- - When a new activity is created
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- With some additional optional filters.
- 

<p align="center">
<img width="500" alt="Automations preview" src="https://user-images.githubusercontent.com/59081450/190612890-147658b8-f7ac-4379-9313-b6c01573e062.png">
</p>
### ✨ Enhancements
- Upgrade Vue from v2 to v3 @mariobalca (#15)
### 🐞 Bug Fixes
- Fix report create/edit issues introduced on (#15) @mariobalca (#58 and #59)
- Fix bug that caused automations coming from GitHub not firing @themarolt (#55)
- Engagement score fix: added a check for tenants that have 0 members with activities less than a year ago. Therefore the engagement score KMeans bug is now fixed @CallmeMehdi (#46)
- Fix some issues related to vue3 and automations/webhooks @mariobalca (#54)
- GitHub integration: we now check if the repository is still accessible by the access token before trying to parse a repository @epipav (#47)
- Fix overflow issue on eagle eye cards/items and tweak the `keywords-input.vue` UX @mariobalca (#52)
- Fix some issues on open.crowd.dev related to SEO's title and description @mariobalca (#41)
- Fix typo when rendering GitHub activities: *stared* switched to *starred*. @joanreyero (#45)
- Conversations title is now being set to first activity title when it exists. Otherwise it uses first activity body. Before it was always getting body. @joanreyero (#44)
- Twitter follow activities were generating different `sourceIds` when `onboarding:true/false`. This was causing duplicate activities on some edge cases. Now twitter follow activities generate the same `sourceIds` with fixed timestamps, independent of `onboarding:true/false` @epipav (#38)
- The dynamic endpoints were not passed to consecutive lambda runs when 15 minute time limit was reached. Endpoints are now passed to new lambdas successfully @epipav  (#50)
## v0.6.0 - 2022-08-31
### Changes
### 🚀 Features
- DEV.to integration support. @themarolt (#11)
- We now detect:
- 
- - comments as activities on all articles published by a DEV.to organization
- 
- 
- 
- 
- 
- 
- 
- 
- - comments as activities on all articles published by a DEV.to user
- 
- 
- 
- 
- 
- 
- 
- 
- 
- This includes replies to comments.
- 
<p align="center">
<img width="500" alt="Dev.to preview" src="https://user-images.githubusercontent.com/59081450/187646962-f22400ee-3d27-4708-872c-2cc7d6cfc4f1.png">
</p>
### ✨ Enhancements
- Tweak eagle eye search bar UI/UX to enhance keyword selection experience. (#13)
### 🐞 Bug Fixes
- Fixed EagleEye content filters: when filtering by more than one keyword, we are now using an *or* operation instead of an *and*. @joanreyero #9
- Fixed an error in engagement score when there are no members in the workspace. @CallmeMehdi (#7)
- Weekly summary email is now sent to all the workspace users, not just one. @epipav (#10)
## v0.5.0 - 2022-08-25
### Changes
- Bumped up version to match pre-OSS version.
### ✨ Enhancements
- Simplified start of development environment @joanreyero (#5)
### 🐞 Bug Fixes
- EagleEye events @joanreyero (#6)
## v0.0.3 - 2022-08-24
### Changes
### 🚀 Features
- Eagle Eye backend @joanreyero
- Eagle Eye frontend @mariobalca
- NodeJS GitHub integration + Discussions @anilb0stanci
- Dev.to integration backend @themarolt
- Conversations auto-publish @mariobalca
### ✨ Enhancements
- Read only role @mariobalca
- Tweak some useMeta titles and descriptions @mariobalca
- Python sls lambda containers @anilb0stanci
- Improved members score @CallmeMehdi