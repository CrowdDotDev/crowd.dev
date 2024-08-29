#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

for lib_dir in $CLI_HOME/../libs/*/; do
  if [ -f "${lib_dir}package.json" ]; then
    lib=$(basename $lib_dir)
    yell "Formatting: $lib!"
    (cd "$lib_dir" && pnpm run format && say "Library $lib: formatted!" && nl)
  fi
done

for archetype_dir in $CLI_HOME/../archetypes/*/; do
  if [ -f "${archetype_dir}package.json" ]; then
    archetype=$(basename $archetype_dir)
    yell "Formatting archetype: $archetype!"
    (cd "$archetype_dir" && pnpm run format && say "Archetype $archetype: formatted!" && nl)
  fi
done
