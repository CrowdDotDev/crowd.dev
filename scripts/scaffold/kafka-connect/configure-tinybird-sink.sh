#!/bin/sh
: '
  Copies the tinybird sink file into tmp and replaces the token placeholder in the file using env CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN.
  Finally starts kafka connect with updated sink file.
'

set -e

if [ -z "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" ] || [ "$CROWD_TINYBIRD_WORKSPACE_ADMIN_TOKEN" = "null" ]; then
  echo "Error: Could not fetch Tinybird token. Exiting."
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
  /etc/kafka-connect/questdb-local-sink.properties \
  "$TINYBIRD_SINK_TEMP_FILE" 



