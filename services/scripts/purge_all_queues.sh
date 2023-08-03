#!/bin/bash

# Get the list of Queue URLs
QUEUE_DATA=$(aws sqs list-queues --region eu-central-1 --endpoint-url http://localhost:9324 --output text)

# Use awk to split the data and get the URLs only.
QUEUE_URLS=$(echo "$QUEUE_DATA" | awk '{print $2}')

# Read each Queue URL
for QUEUE_URL in $QUEUE_URLS
do
  # Purge each queue
  echo "Purging $QUEUE_URL"
  aws --region eu-central-1 --endpoint-url http://localhost:9324 sqs purge-queue --queue-url $QUEUE_URL
done