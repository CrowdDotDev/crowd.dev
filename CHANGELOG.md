# Changelog

All notable changes to this project will be documented in this file.

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
- - When a new activity is created
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
- - comments as activities on all articles published by a DEV.to user
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
