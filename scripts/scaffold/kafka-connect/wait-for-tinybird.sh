#!/bin/sh
: '
  Waits the tinybird-local container to be ready and fetches the workspace admin token.
  Then copies the tinybird sink files into tmp and 
  replaces the token placeholder in the file.
  Finally starts kafka connect with updated sink files.
'

set -e

echo "Waiting for Tinybird to be ready..."
until curl -s -f http://tinybird:80/tokens; do
  echo "Tinybird is not ready yet. Retrying in 5 seconds..."
  sleep 5
done

echo "Tinybird is ready! Fetching workspace token..."
CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN=$(curl -s http://tinybird:80/tokens | jq -r '.workspace_admin_token')

if [ -z "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" ] || [ "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" = "null" ]; then
  echo "Error: Could not fetch Tinybird token. Exiting."
  exit 1
fi
ACTIVITIES_SINK_FILE="/etc/kafka-connect/tinybird-local-activities-sink.properties"
ACTIVITIES_SINK_TEMP_FILE="/tmp/tinybird-local-activities-sink.properties"

ACTIVITY_RELATIONS_SINK_FILE="/etc/kafka-connect/tinybird-local-activity-relations-sink.properties"
ACTIVITY_RELATIONS_SINK_TEMP_FILE="/tmp/tinybird-local-activity-relations-sink.properties"

cp "$ACTIVITIES_SINK_FILE" "$ACTIVITIES_SINK_TEMP_FILE"
cp "$ACTIVITY_RELATIONS_SINK_FILE" "$ACTIVITY_RELATIONS_SINK_TEMP_FILE"

sed -i "s|\${CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN}|$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN|g" "$ACTIVITIES_SINK_TEMP_FILE"
sed -i "s|\${CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN}|$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN|g" "$ACTIVITY_RELATIONS_SINK_TEMP_FILE"

echo "✅ Using token [$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN] in Tinybird http sink of Kafka Connect."

exec connect-standalone \
  /etc/kafka-connect/worker-local.properties \
  /etc/kafka-connect/console-local-sink.properties \
  /etc/kafka-connect/questdb-local-sink.properties \
  "$ACTIVITIES_SINK_TEMP_FILE" \
  "$ACTIVITY_RELATIONS_SINK_TEMP_FILE"
