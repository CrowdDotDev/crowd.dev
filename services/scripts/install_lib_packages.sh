#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

FLAGS=$1

for lib_dir in $CLI_HOME/../libs/*/; do
  if [ -f "${lib_dir}package.json" ]; then
    lib=$(basename $lib_dir)
    yell "Installing packages for library: $lib! $FLAGS"
    cd $lib_dir && npm ci $FLAGS
  fi
done

printf '%s\0' $CLI_HOME/../archetypes/*/ | xargs -0 -n1 -P$N -I{} bash -c '
    if [ -f "{}/package.json" ]; then
        archetype=$(basename {})
        printf "${YELLOW}Installing packages for archetype: $archetype! $FLAGS${RESET}\n"
        (cd {} && npm ci $FLAGS)
    fi
'

printf "${GREEN}All library packages installed!${RESET}\n"
