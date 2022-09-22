# Changelog

All notable changes to this project will be documented in this file.

## v0.7.0 - 2022-09-16

### Changes

### 🚀 Features

- Automations feature @mariobalca (#49) and @themarolt (#43)
- We now support webhooks as the first tool in our automations feature.
- This means you can now set up a webhook automation to be triggered:
- 
- - When a new member is detected
- - When a new activity is created
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
- - comments as activities on all articles published by a DEV.to user
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
