#!/usr/bin/env bash
if [[ ${TERM} == "" || ${TERM} == "dumb" ]]; then
    RED=""
    GREEN=""
    GREY=""
    YELLOW=""
    RESET=""
else
    RED=`tput setaf 1`
    GREEN=`tput setaf 2`
    GREY=`tput setaf 7`
    YELLOW=`tput setaf 3`
    RESET=`tput sgr0`
fi

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

FLAGS=$1
N=3  # change this to control the concurrency level

printf '%s\0' $CLI_HOME/../libs/*/ | xargs -0 -n1 -P$N -I{} bash -c '
    if [ -f "{}/package.json" ]; then
        lib=$(basename {})
        printf "${YELLOW}Installing packages for library: $lib! $FLAGS${RESET}\n"
        (cd {} && npm ci $FLAGS)
    fi
'

printf "${GREEN}All library packages installed!${RESET}\n"
