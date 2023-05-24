#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

input_param=$1

$CLI_HOME/install_lib_packages.sh $input_param &
$CLI_HOME/install_app_packages.sh $input_param &

wait

say "All packages installed!"