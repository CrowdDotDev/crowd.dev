#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

LIBRARIES=(
  "common"
  "logging"
  "database"
  "sqs"
)

for library in "${LIBRARIES[@]}"; do
  echo "Building library: $library!"
  (cd $CLI_HOME/libs/$library && npm run build)
done

wait 

echo "All libraries built!"