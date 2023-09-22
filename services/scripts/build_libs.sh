#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

LIBRARIES=(
  "types"
  "common"
  "logging"
  "tracing"
  "database"
  "redis"
  "sqs"
  "sentiment"
  "conversations"
  "integrations"
  "alerting"
  "opensearch"
)

for library in "${LIBRARIES[@]}"; do
  yell "Building library: $library"
  (cd "$CLI_HOME/../libs/$library" && npm run build && say "Library built: $library!" && nl)
done

say "All libraries built!"