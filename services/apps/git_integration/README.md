# Git Integration V2

The Git integration is a Kubernetes-based service that processes Git repositories to extract contributor information from commits. It runs as worker pods that acquire repositories from the database queue, clone and process them, extract commits and maintainers, and send the processed data to Kafka for downstream ingestion.