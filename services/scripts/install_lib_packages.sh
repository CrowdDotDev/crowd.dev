#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

printf '%s\0' $CLI_HOME/../libs/*/ | xargs -0 -n1 -P$N -I{} bash -c '
    if [ -f "$0/package.json" ]; then
        lib=$(basename $0)
        printf "${YELLOW}Installing packages for library: $lib! $FLAGS${RESET}\n"
        (cd $0 && npm ci $FLAGS)
    fi
' {}

printf '%s\0' $CLI_HOME/../archetypes/*/ | xargs -0 -n1 -P$N -I{} bash -c '
    if [ -f "$0/package.json" ]; then
        archetype=$(basename $0)
        printf "${YELLOW}Installing packages for archetype: $archetype! $FLAGS${RESET}\n"
        (cd $0 && npm ci $FLAGS)
    fi
' {}

printf "${GREEN}All library packages installed!${RESET}\n"
