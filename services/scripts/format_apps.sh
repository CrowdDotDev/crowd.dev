#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

for app_dir in $CLI_HOME/../apps/*/; do
  if [ -f "${app_dir}package.json" ]; then
    app=$(basename $app_dir)
    yell "Formatting app: $app!"
    (cd "$app_dir" && pnpm run format && say "App $app: formatted!" && nl)
  fi
done

for app_dir in $CLI_HOME/../apps/premium/*/; do
  if [ -f "${app_dir}package.json" ]; then
    app=$(basename $app_dir)
    yell "Formatting app: $app!"
    (cd "$app_dir" && pnpm run format && say "App $app: formatted!" && nl)
  fi
done
