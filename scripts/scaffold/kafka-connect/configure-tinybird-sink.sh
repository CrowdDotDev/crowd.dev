#!/bin/sh
: '
  Copies the tinybird sink file into tmp and replaces the token placeholder in the file using env CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN.
  Finally starts kafka connect with updated sink file.
'

set -e

echo "Waiting for Tinybird to be ready and fetching admin token..."

MAX_RETRIES=30
RETRY_DELAY=5
attempt=1

while [ $attempt -le $MAX_RETRIES ]; do
  CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN=$(curl -s "http://tinybird:7181/tokens" 2>/dev/null | jq -r '.workspace_admin_token' 2>/dev/null || echo "")
  
  if [ -n "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" ] && [ "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" != "null" ]; then
    echo "Successfully fetched Tinybird token on attempt $attempt"
    break
  fi
  
  echo "Tinybird not ready yet (attempt $attempt/$MAX_RETRIES). Retrying in $RETRY_DELAY seconds..."
  sleep $RETRY_DELAY
  attempt=$((attempt + 1))
done

if [ -z "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" ] || [ "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" = "null" ]; then
  echo "Error: Could not fetch Tinybird token after $MAX_RETRIES attempts. Exiting."
  exit 1
fi

TINYBIRD_SINK_FILE="/etc/kafka-connect/tinybird-local-sink.properties"
TINYBIRD_SINK_TEMP_FILE="/tmp/tinybird-local-sink.properties"

cp "$TINYBIRD_SINK_FILE" "$TINYBIRD_SINK_TEMP_FILE"

sed -i "s|\${CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN}|$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN|g" "$TINYBIRD_SINK_TEMP_FILE"

echo "Using token [$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN] in Tinybird http sink of Kafka Connect."

exec connect-standalone \
  /etc/kafka-connect/worker-local.properties \
  /etc/kafka-connect/console-local-sink.properties \
  "$TINYBIRD_SINK_TEMP_FILE" 



