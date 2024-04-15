# Configure Integrations for Community Edition

crowd.dev offers a variety of integrations to help you track community activities across different platforms. This document provides a detailed guide on how to set up each integration and connect with the app.

## Table of Contents

1. [GitHub](#1-github)
2. [Discord](#2-discord)
3. [Hacker News](#3-hacker-news)
4. [LinkedIn](#4-linkedin)
5. [Twitter](#5-xtwitter)
6. [HubSpot](#6-hubspot)
7. [Slack](#7-slack)
8. [Dev](#8-dev)
9. [Reddit](#9-reddit)
10. [Stack Overflow](#10-stack-overflow)
11. [Discourse](#11-discourse)
12. [Zapier](#12-zapier)
13. [n8n](#13-n8n)
- [Nango configuration](#nango-configuration)

## 1. GitHub

Data tracked includes activities such as stars/un-stars, forks, issues, pull requests, discussions, comments on issues/pull requests/discussions, and the closing of issues/pull requests/discussions. Additionally, historical imports are supported with no limitation. The refresh period is instant, with a maximum delay of a few seconds.


To set up GitHub integration, make sure you provide the following env variables in the backend:

```sh
CROWD_GITHUB_APP_ID
CROWD_GITHUB_CLIENT_ID
CROWD_GITHUB_CLIENT_SECRET
CROWD_GITHUB_PRIVATE_KEY
CROWD_GITHUB_WEBHOOK_SECRET
```

You can obtain these environment variables by registering a new GitHub App. Follow the steps outlined in the [GitHub docs](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) to register your app and retrieve the necessary creds.

When setting up your GitHub App, ensure you configure the permissions as `read-only`. The app doesn't write any data, it only requires read access. 

The necessary permissions are:

- Repository permissions
    - **Contents**
    - **Discussions**
    - **Issues**
    - **Metadata**
    - **Pull requests**
- Organization permissions
    - **Events** 
    - **Members**
    - **Projects**
- Account permissions
    - **Email addresses**
    - **Followers**
    - **Starring**
    - **Watching**



### To connect GitHub with crowd.dev

1. Go to the Integration settings within your crowd.dev workspace.
2. Connect GitHub by following the prompts.
3. Choose the workspace you want to connect.
4. Select the repositories within the workspace you want to connect.

If you are an organization member, you will most likely need your admin's approval to set up the integration to crowd.dev. In order to do that successfully, you need to:

1. Invite the GitHub organization admin to crowd.dev
    
    Go to the User Settings. Click on invite and follow the steps to invite the GitHub organization owner with an admin role.

2. Ask the GitHub organization owner to sign up to crowd.dev

    They will have received an email from us with an invitation to your crowd.dev workspace. If they follow the link, they will be taken to a sign-up page where they will be able to join your workspace.

3. Ask them to approve your GitHub installation request

    They should go over to the Integration settings and re-start the GitHub flow. Since they have the proper permissions, it will work for them.

That’s it. We're now collecting all community activities from your connected repos, including pull requests, issues, stars, and forks.

## 2. Discord

Data tracked includes activities such as when someone joins a server, messages, replies in threads, and historical imports, with no limitations. We do not track reactions and when someone leaves a server. The refresh period is almost instant.

To set up Discord integration, make sure you provide the following env variables in the backend:

```sh
CROWD_DISCORD_TOKEN
```

For more information on how to obtain these environment variables, please refer to the [Discord Developer Documentation](https://discord.com/developers/docs/quick-start/overview-of-apps).

When setting up your Discord App, ensure you configure the below permissions to work properly:
   - Enable `Read Message History` or `permission integer: 65536`

### To connect Discord with crowd.dev

1. Connect Discord bot
    - Go to the Integration settings and follow the steps to connect Discord.
    - Give the crowd.dev bot access to your Discord server.

2. Add Discord bot to private channels
    
    By default, our bot can only fetch data from public channels. If you need a specific role to join channels and still want to collect the data from those channels, you must give the bot the suitable server role.

## 3. Hacker News

Data tracked includes activities such as posts that reach the Top or Best categories, along with their nested comments. Only posts created after December 1, 2022, are guaranteed to be imported. We do not track posts that do not mention your community explicitly. The refresh period is set to every hour.

To set up, Hacker News integration doesn't require any specific environment variables.

### To connect Hacker News with crowd.dev

Go to the Integration settings and follow the steps to connect to Hacker News.

You will see two different input options: mentions and URLs.

- Mentions are the name(s) of your company or community. The more holistic the selection, the better. However, please do not make it too broad not to pollute your workspace data.

- URLs are the different URLs that are relevant to your company and community. This could be your homepage, your app, or your GitHub repository

## 4. LinkedIn

Data tracked includes activities such as comments and reactions on posts, along with historical imports, for up to 12 months. We don't track followers or mentions. The refresh period for data is every 60 minutes.

LinkedIn uses Nango Integrations for API data tracking, so ensure Nango environment variables are configured properly. See below for [Nango configuration details](#nango-configuration).

### To connect LinkedIn with crowd.dev

Go to the Integration settings and follow the steps to connect LinkedIn.

- For LinkedIn accounts that administrate a single organization page: 
Just click on the Connect button, and that's it!

- For LinkedIn accounts that administrate multiple organizations pages: 
Click on the Connect button of the LinkedIn integration and authorize our LinkedIn app. In the next step, a drawer opens, and you need to select which organizations' page you want to track. Once you've selected an organization from the select box, click Update, and it's done!

## 5. X/Twitter

Data tracked includes activities such as tweets matching specific queries like Twitter handles, hashtags, or keywords, and contact attributes such as name, profile picture, bio, location, and follower count.

To set up Twitter integration, make sure you provide the following env variables in the backend:

```sh
CROWD_TWITTER_CLIENT_ID
CROWD_TWITTER_CLIENT_SECRET
```

For more information on how to obtain these environment variables, please refer to the [Twitter Developer Docs](https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api#:~:text=Step%20one%3A%20Sign%20up%20for%20a%20developer%20account&text=Next%20you%20will%20create%20a,all%20requests%20to%20the%20API).


### To connect Twitter with crowd.dev

Go to the Integration settings and follow the steps to connect Twitter.

That’s it! crowd.dev now track mentions of a connected Twitter account, so when someone mentions the username, it will be an activity.


## 6. HubSpot

Data from crowd.dev contacts and organizations is synchronized with HubSpot contacts and companies, respectively. The refresh period is every 8 hours.

HubSpot uses Nango Integrations for API data tracking, so ensure Nango environment variables are configured properly. See below for [Nango configuration details](#nango-configuration).

### To connect HubSpot with crowd.dev

Go to the Integration settings and follow the steps to connect HubSpot.

1. Connect HubSpot
    - Select the HubSpot account that you want to connect to crowd.dev. The HubSpot user should have permissions to these scopes to successfully connect the integration:

        ```sh
        - crm.objects.contacts.read
        - crm.objects.contacts.write
        - crm.schemas.contacts.read
        - crm.objects.companies.read
        - crm.objects.companies.write
        - crm.schemas.companies.read
        - crm.lists.read
        - crm.lists.write
        ```
2. Enable integration for contacts and/or organizations
    
    After connecting HubSpot, integration requires additional setup through the settings drawer. First, select for which entities (contacts and/or organizations) you want to enable the integration for.

    ##### Data-in

    Existing contacts and organizations will automatically be enriched with data points from HubSpot contacts every 8 hours.
    
    Contacts will be identified using the HubSpot contact e-mails. Organizations will be identified using the HubSpot company name. The integration will only enrich fields that were mapped during initializing the integration.

    ##### Data-out
        
    To send entities to HubSpot, use Automations or sync entities manually using the contact/organizations context menu, Sync with HubSpot menu item.
        
    **Contacts without an e-mail will not be synced to HubSpot.**

    **Organizations without a website will not be synced to HubSpot.**
    
3. Map the attributes between crowd.dev and HubSpot

    In the attributes mapping section, you will see all the mappable fields of crowd.dev. Check the checkbox next to the fields and select the HubSpot field in which you want to map the crowd.dev field with.

    **We recommend creating custom properties in Hubspot for every crowd.dev attribute.**

    This will ensure that crowd.dev won't overwrite already-in-use fields in HubSpot.

    To create custom contact properties in HubSpot go to Contacts -> Actions -> Edit properties

    To create custom company properties in Hubspot go to Companies -> Actions -> Edit properties

    Fields can be mapped only if the type also matches. ie: You can map thedisplayName property to a string HubSpot property or you can map thescore property to a number HubSpot property.

    After creating the properties in HubSpot, click Update attributes button on the drawer so that crowd.dev gets the newly created attributes from HubSpot.

    Some fields are read-only calculated fields. These are denoted with a single right-direction arrow. These fields will be pushed to HubSpot (using either automations or manual sync) but data-in will not get these fields back into crowd.dev.

    After attribute mapping is done, use the update button to start the data-in integration.


#### Syncing entities manually

After integration status goes into connected state, you can start syncing contacts and organizations manually.

You can find Sync with HubSpot button using the contacts and organizations context menu.

#### Syncing entities using automations

You can also use automations to push data to HubSpot. When contacts or organizations conform to the defined filters, they will be synced to HubSpot automatically.

Go to `settings -> automations -> add automation` to start adding HubSpot automations.

#### Contact automations

Automations for contacts support adding found contacts into HubSpot static lists. These lists should exist before you start creating the automation.

To create a static contact list in HubSpot, go to Contacts -> Lists -> Create List.

**You should create a static list, and not a dynamic (active) one**. Dynamic lists are purely managed by HubSpot, and HubSpot won't let us add contacts to these lists manually.

Give your list a meaningful name and save it.

Now we're all set to add a HubSpot automation.

Choose the trigger and set the desired filters.

You can set the logical operator between filters to Matching all (and) or Matching any (or)

Select the HubSpot list that you just created and click Add automation

Upon first creation of the automation, crowd.dev will sync the existing contacts that were already conforming to the given filters immediately. Every 8 hours the sync will happen again, catching the new entities conforming to the filters and also updating already synced contacts again for changed properties.

#### Organization automations

Quite similar to contact automations with few differences.
After setting the filters, now you can also check the option `Sync all contacts from the organizations matching your conditions criteria`. Checking this will sync all organization contacts found with given filters to HubSpot, also adding these contacts to the selected contact list below.

## 7. Slack

Data tracked includes activities such as when someone joins a channel, messages including replies in threads, and historical imports, with no limitations. However, reactions are not tracked. The refresh period is set at 20 minutes.

To set up Slack integration, make sure you provide the following env variables in the backend:

```sh
CROWD_SLACK_CLIENT_ID
CROWD_SLACK_CLIENT_SECRET
CROWD_SLACK_TEAM_ID
CROWD_SLACK_APP_ID
CROWD_SLACK_APP_TOKEN
CROWD_SLACK_NOTIFIER_CLIENT_ID
CROWD_SLACK_NOTIFIER_CLIENT_SECRET
```

For more information on how to obtain these environment variables, please refer to the [Slack Developer Quickstart Guide](https://api.slack.com/start/quickstart).

When setting up your Slack App, ensure you configure the below permissions to work properly:

```
// Enable these permissions
"user": [
    "channels:history",
    "channels:read",
    "reactions:read",
    "users:read",
    "users:read.email"
],
"bot": [
    "channels:history",
    "channels:join",
    "channels:read",
    "files:read",
    "reactions:read",
    "users:read",
    "users:read.email"
]
```

### To connect Slack with crowd.dev

1. Connect Slack bot

    Go to the Integration settings and follow the steps to connect Slack.

2. Add Slack bot to channels

    To fetch data from Slack, you need to add the crowd.dev Slack bot to all channels.

    There are two options for this:

    **Option 1: Adding the bot directly from the channel**

    This is the quickest option if you do not have many channels. Go to the channel and type: @Crowd.dev and send the message.

    A pop-up will appear. Simply click *Add to Channel* and the bot will be able to get all messages from this channel.

    **Option 2: Adding from the channel settings**

    Alternatively, you can add the bot in bulk from the channel settings.

    1. On the sidebar, right-click on the first channel where you would like the integration to be and click on Open channel details.

    2. Head over to the Integrations tab and click on Add an App 

    3. Search for "crowd.dev" and click on Add

    4. Once the app is added, if you go to the channel where you added the app you will see a message like this

    5. Clicking on the logo, a menu will appear with an option to add the integration to more channels.

    6. Now you can select the channel that you want to connect.

    7. Repeat steps 5 and 6 for each channel that you would like the crowd.dev integration to have access to.

## 8. Dev

Data tracker includes activities like nested comments on all articles published by selected Dev organizations or users, along with historical imports, without any limit. We do not track follows of organizations or users. The refresh period is set at 20 minutes.

To set up Dev integration, make sure you provide the following env variables in the backend:

```sh
CROWD_DEVTO_API_KEY
```

For more information on how to obtain these environment variables, please refer to the [DEV.to API Guide](https://dev.to/guilhermecheng/how-to-use-devto-api-4p65).


### To connect Dev with crowd.dev

Go to the Integration settings and follow the steps to connect DEV.

Copy the slug (dev.to/slug) from the organization or user that you'd like to track and pass it into the form.

Example: To track comments from crowd.dev DEV articles, you have to insert crowddotdev and confirm with "Connect"

Note: We highly recommend only to track accounts that are directly related to your company/community. Otherwise, you will potentially pollute your workspace data.

## 9. Reddit

Data tracked includes activities such as posts published on a specified subreddit and nested comments on all posts. Unfortunately, Reddit limits the API to gather a maximum of 1000 posts in the past per subreddit for historical imports. We do not tract upvotes of posts and comments, as that information is private on Reddit's end. The refresh period is set at 20 minutes.

Reddit uses Nango Integrations for API data tracking, so ensure Nango environment variables are configured properly. See below for [Nango configuration details](#nango-configuration).

### To connect Reddit with crowd.dev

Go to the Integration settings and follow the steps to connect Reddit.

Copy the subreddit that you would like to track into the form. We will automatically validate if it exists. Once you have added it, click on Connect. You will be redirected to Reddit, asking you to accept the crowd.dev app. Click on Allow, and it is done!

Note: We highly recommend only tracking subreddits that are directly related to your community or organization. Otherwise, you risk highly polluting your workspace's data.

## 10. Stack Overflow

Data tracked includes activities including questions tagged with supplied tags and mentioning supplied keywords, as well as answers to these questions. Historical import depends on the size of a community, typically with no limit. We do not track comments on questions, and answers. The refresh period is set at 60 minutes.

Stack Overflow uses Nango Integrations for API data tracking, so ensure Nango environment variables are configured properly. See below for [Nango configuration details](#nango-configuration).

### To connect Stack Overflow with crowd.dev

Go to the Integration settings and follow the steps to connect Stack Overflow.

Stack Overflow doesn't have organizational accounts, so you might want to create a shared account to connect integration. When connecting the integration, please make sure that you are logged into the Stack Overflow account you want to connect with crowd.dev.

## 11. Discourse

Data tracked includes historical imports by creating activities for all topics and posts, and also generates contacts for users involved in these activities. For incremental imports, it creates activities for new topics, posts, users who joined the forum, and likes on posts, with contacts generated for corresponding users.

To set up Discourse, we do not require any env variables in the backend; instead, they're passed from the UI. See below for the details.

### To connect Discourse with crowd.dev

- API Keys

    To create API in your Discourse instance, you should be an admin.

    1. First, click on the setting and go to the Admin panel
    2. Go to the API tab and click on New API Key.
    3. Give your API key some description, set the user level of Single User, select system user (it is available in all Discourse instances) and tick Global Key.
    4. Copy your API key and paste it into crowd.dev.

- Webhooks

    Once you configure API connection in crowd.dev, you will see a section with `Payload URL` and `Webhook Secret` to configure webhooks in Discourse.

    1. Go to an admin panel in your Discourse instance
    2. Go to API tab, and then to Webhooks tab inside it. Click on New Webhook button.
    3. Paste your Payload URL and Secret which you copied from crowd.dev app
    4. Scroll down and check Send me everything option (ignore all other options)
    5. Scroll down a bit more and check both options
    6. After you configured everything, go back to crowd.dev app and click Connect. Now, you will receive webhooks.
    7. If you want to verify webhooks are configured properly, you can click on settings and then click on Verify webhook. Before clicking this button, make sure to do some action in Discourse - e.g. logging in / out, liking a post, or using a Ping button in webhooks section.

## 12. Zapier

Zapier integration with crowd.dev enables to access 5,000+ apps.

We do not require any env variables in the backend for the app. See below for the details on it connected.

### To connect Zapier with crowd.dev

To start using the integration, go to the Integration settings and follow the steps to set up Zapier.

#### Supported triggers

Triggers are a Zapier way to listen for new events (basically webhooks). crowd.dev's Zapier integration supports two types of triggers: **New Activity** and **New Contact**.

##### New Activity

This trigger is activated when a new activity happens in your community platforms connected to crowd.dev. For example, someone starred your repo, sent a message in Discord, etc.

You can make this trigger granular. For example, only activate it when someone opens a pull request on GitHub and mentions a specific keyword. On the other side of the spectrum, you can configure this trigger to be a "catch-all", but this setup is not recommended because it will be quite hard to distinguish between different events on a Zapier side. So the recommended configuration is to keep this trigger as narrow as possible.

##### New Contact

This trigger is activated when a new contact joins your community platforms connected to crowd.dev. In crowd.dev, a contact is considered anyone who performed at least one action at your community platforms - e.g., joined a Discord server or did something on GitHub (the trigger is activated only once for each user).

This trigger can be configured as a "catch-all" (all new contact activities for all active platforms) or only for specific platforms.

#### Supported actions

Actions in Zapier are commands that the integration can perform (basically API calls). crowd.dev Zapier integration supports multiple actions:

##### Activity

- Create or update activity for a contact - takes a contact object and information about activity and creates or updates an activity for this contact in crowd.dev

- Create or update activity - takes an activity object and creates or updates an activity in crowd.dev based on sourceId of activity and platform.

It's worth noting, that these actions are intended only for activities from custom platforms not supported by crowd.dev. For example, they can be used to automatically creates activities for contacts who attended a meetup, purchased a swag, etc.

##### Contacts

- **Create or update contact** - takes a contact object and creates or updates a contact in crowd.dev
- **Update contact** - takes a contact object and updates an existing contact in crowd.dev based on `contactId`. Fails if the contact doesn't exist.
- **Find task** - returns a contact object for an existing contact based on `contactId`. Fails if the contact doesn't exist.
- **Delete contact** - deletes an existing contact based on `contactId`. Fails if the contact doesn't exist.

##### Organization

- **Create organization** - creates a new organization in crowd.dev
- **Update organization** - updates an existing organization in crowd.dev by `organizationId`. Fails if the organization doesn't exist.
- **Find organization** - returns an organization object for an existing organization based on `organizationId`. Fails if the organization doesn't exist.
- **Delete organization** - deletes an existing organization based on `organizationId`. Fails if the organization doesn't exist.

##### Task

- **Create task** - creates a new task in crowd.dev
- **Update task** - updates an existing task in crowd.dev by `taskId`. Fails if the task doesn't exist.
- **Find task** - returns a task object for an existing task based on `taskId`. Fails if the task doesn't exist.
- **Delete task** - deletes an existing task based on `taskId`. Fails if the task doesn't exist.

##### Note

- **Create note** - create a new note in crowd.dev
- **Update note** - updates an existing note in crowd.dev by `noteId`. Fails if the note doesn't exist.
- **Find note** - returns a note object for an existing note based on `noteId`. Fails if the note doesn't exist.
- **Delete note** - deletes an existing note based on `noteId`. Fails if the note doesn't exist.

## 13. n8n

n8n integration with crowd.dev enables to access 5,000+ apps.

We do not require any env variables in the backend for the app. See below for the details on it connected.

### To connect n8n with crowd.dev

To start using the integration, go to the Integration settings and follow the steps to set up n8n.

#### Supported operations

An operation is something an n8n node does, such as getting or sending data. There are two types of operation:

**Triggers** start a workflow in response to specific events or conditions in your services. When you select a Trigger, n8n adds a trigger node to your workflow, with the Trigger operation you chose pre-selected. When you search for a node in n8n, Trigger operations have a bolt icon Trigger icon.

**Actions** are operations that represent specific tasks or actions within a workflow, allowing you to manipulate data, perform operations on external systems, and trigger events in other systems as part of your workflows. When you select an Action, n8n adds a node to your workflow, with the Action operation you chose pre-selected.

##### Triggers

The crowd.dev trigger node allows you to respond to events in crowd.dev and integrate crowd.dev with other applications. n8n has built-in support for a wide range of crowd.dev events, which include new activities and new contacts.

- **New Activity**: This trigger is activated when a new activity happens in your community platforms connected to crowd.dev. For example, someone starred your repo, sent a message in Discord, etc. You can make this trigger granular. For example, only activate it when someone opens a pull request on GitHub and mentions a specific keyword. On the other side of the spectrum, you can configure this trigger to be a "catch-all", but this setup is not recommended because it will be quite hard to distinguish between different events on n8n side. So, the recommended configuration is to keep this trigger as narrow as possible.

- **New Contact**: This trigger is activated when a new contact joins your community platforms connected to crowd.dev. In crowd.dev, a contact is considered anyone who performed at least one action at your community platforms - e.g., joined a Discord server or did something on GitHub (the trigger is activated only once for each user). This trigger can be configured as a "catch-all" (all new contact activities for all active platforms) or only for specific platforms.

##### Actions

The crowd.dev node allows you to automate work in crowd.dev and integrate crowd.dev with other applications. n8n has built-in support for a wide range of crowd.dev features include creating, updating, and deleting contacts, notes, organizations, and tasks.

###### Activity

- **Create or update activity for a contact** - takes a contact object and information about the activity and creates or updates an activity for this contact in crowd.dev
- **Create or update activity** - takes an activity object and creates or updates an activity in crowd.dev based on sourceId of activity and platform

###### Contact

- **Create or update contact** - takes a contact object and creates or updates a contact in crowd.dev
- **Update contact** - takes a contact object and updates an existing contact in crowd.dev based on `contactId`. Fails if the contact doesn't exist.
- **Find task** - returns a contact object for an existing contact based on `contactId`. Fails if the contact doesn't exist.
- **Delete contact** - deletes an existing contact based on `contactId`. Fails if the contact doesn't exist.

###### Organization

- **Create organization** - creates a new organization in crowd.dev
- **Update organization** - updates an existing organization in crowd.dev by `organizationId`. Fails if the organization doesn't exist.
- **Find organization** - returns an organization object for an existing organization based on `organizationId`. Fails if the organization doesn't exist.
- **Delete organization** - deletes an existing organization based on `organizationId`. Fails if the organization doesn't exist.

###### Note

- **Create note** - create a new note in crowd.dev
- **Update note** - updates an existing note in crowd.dev by `noteId`. Fails if the note doesn't exist.
- **Find note** - returns a note object for an existing note based on `noteId`. Fails if the note doesn't exist.
- **Delete note** - deletes an existing note based on noteId. Fails if the note doesn't exist.

###### Task

- **Create task** - creates a new task in crowd.dev
- **Update task** - updates an existing task in crowd.dev by `taskId`. Fails if the task doesn't exist.
- **Find task** - returns a task object for an existing task based on `taskId`. Fails if the task doesn't exist.
- **Delete task** - deletes an existing task based on `taskId`. Fails if the task doesn't exist.

###### Automation

- **Create automation** - creates a new automation workflow in crowd.dev
- **Destroy** - destorys an automation workflow in crowd.dev
- **Find** - returns an automation object for an existing automation based on `automationId`. Fails if the automation doesn't exist.
- **List** - lists all automation objects in crowd.dev
- **Update** - updates an existing automation in crowd.dev by automationID. Fails if the automation doesn't exist.

## Nango Configuration

Some of our integrations, like LinkedIn, Reddit, Stack Overflow, and HubSpot, use Nango for the APIs. Make sure to provide the following env variables to work properly.

```sh
CROWD_NANGO_URL
CROWD_NANGO_SECRET_KEY
```

For more information on how to obtain these environment variables, please refer to the [Nango docs](https://docs.nango.dev/introduction).