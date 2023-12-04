#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

for lib_dir in $CLI_HOME/../libs/*/; do
  if [ -f "${lib_dir}package.json" ]; then
    lib=$(basename $lib_dir)
    yell "Checking linting, prettier and typescript for library: $lib!"
    (cd "$lib_dir" && pnpm run lint && pnpm run format-check && pnpm run tsc-check && say "Library $lib: linter, prettier and typescript checked!" && nl)    
  fi
done

for archetype_dir in $CLI_HOME/../archetypes/*/; do
  if [ -f "${archetype_dir}package.json" ]; then
    archetype=$(basename $archetype_dir)
    yell "Checking linting, prettier and typescript for archetype: $archetype!"
    (cd "$archetype_dir" && pnpm run lint && pnpm run format-check && pnpm run tsc-check && say "Archetype $archetype: linter, prettier and typescript checked!" && nl)    
  fi
done
