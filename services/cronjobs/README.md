The directories here contain code that is meant to run periodically and doesn't require the complexity of Temporal.

The first service (archived_repositories) is an asynchronous task that uses [BullMQ](https://bullmq.io/) as an 
asynchronous task runner.

It runs using Kubernetes cron jobs but could also easily run using systemd jobs, or even plain old cron jobs (the latter 
seem to have their days numbered, though; Most Linux distributions are deprecating them, and some don't even ship cron
anymore).

It can serve as an example for other simple cron jobs that also don't need Temporal.