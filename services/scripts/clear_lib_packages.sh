#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

for lib_dir in $CLI_HOME/../libs/*/; do
  if [ -d "${lib_dir}node_modules" ]; then
    lib=$(basename $lib_dir)
    yell "Removing node_modules for library: $lib!"
    (cd $lib_dir && rm -rf node_modules) &
  fi
done

wait