#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

FLAGS=$1

for lib_dir in $CLI_HOME/../libs/*/; do
  if [ -f "${lib_dir}package.json" ]; then
    lib=$(basename $lib_dir)
    yell "Installing packages for library: $lib! $FLAGS"
    (cd $lib_dir && npm ci $FLAGS) &
  fi
done

wait

say "All library packages installed!"