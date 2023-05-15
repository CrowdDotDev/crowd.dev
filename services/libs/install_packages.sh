#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/../../scripts/utils

for library_dir in $CLI_HOME/*/; do
  if [ -f "${library_dir}package.json" ]; then
    library=$(basename $library_dir)
    say "Installing packages for library: $library!"
    (cd $library_dir && npm i) &
  fi
done

wait

say "All libraries packages installed!"