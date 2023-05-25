#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

for lib_dir in $CLI_HOME/../libs/*/; do
  if [ -f "${lib_dir}package.json" ]; then
    lib=$(basename $lib_dir)
    yell "Checking linting, prettier and typescript for library: $lib!"
    (cd "$lib_dir" && npm run lint && npm run format-check && npm run tsc-check && say "Library $lib: linter, prettier and typescript checked!" && nl)    
  fi
done
