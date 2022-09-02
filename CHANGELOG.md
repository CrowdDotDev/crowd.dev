# Changelog

All notable changes to this project will be documented in this file.

## v0.6.0 - 2022-08-31

### Changes

### 🚀 Features

- DEV.to integration support. @themarolt (#11)
- We now detect:
- 
- - comments as activities on all articles published by a DEV.to organization
- - comments as activities on all articles published by a DEV.to user
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
