#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/../../scripts/utils

LIBRARIES=(
  "types"
  "common"
  "logging"
  "database"
  "sqs"
  "integrations"
)

for library in "${LIBRARIES[@]}"; do
  say "Building library: $library!"
  (cd $CLI_HOME/$library && npm run build)
done

wait 

say "All libraries built!"