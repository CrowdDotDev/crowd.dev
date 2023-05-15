#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/../scripts/utils

$CLI_HOME/libs/install_packages.sh &

for app_dir in $CLI_HOME/apps/*/; do
  if [ -f "${app_dir}package.json" ]; then
    app=$(basename $app_dir)
    echo "Installing packages for service: $app!"
    (cd $app_dir && npm i) &
  fi
done

wait

say "All packages installed!"