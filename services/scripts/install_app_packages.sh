#!/usr/bin/env bash

set -eo pipefail
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $CLI_HOME/utils.sh

input_param=$1

if [ ! -z "$input_param" ]; then
  FLAGS="--${input_param}"
else
  FLAGS=""
fi


for app_dir in $CLI_HOME/../apps/*/; do
  if [ -f "${app_dir}package.json" ]; then
    app=$(basename $app_dir)
    yell "Installing packages for app: $app!"
    (cd $app_dir && npm i $FLAGS) &
  fi
done

wait

say "All app packages installed!"