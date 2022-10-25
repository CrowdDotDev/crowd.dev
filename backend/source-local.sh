#!/usr/bin/env bash

CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

set -a
. $CLI_HOME/.env.dist.local
. $CLI_HOME/.env.override.local
set +a
