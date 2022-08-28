#!/usr/bin/bash
# Starts a slim version of crowd services.
# Usage `bash start.sh [ -l | --localVersion ]`
# Started services will use the generic .env.dist environment variable
# which doesn't have integration related client id/secrets. By default, 
# script will try to get the latest released version using git tags. 
# App will be availabe at https://app.localhost

if [[ $1 == "dev" ]]; then
  IS_DEV=true
else
  IS_DEV=false
fi

set -ue pipefail

CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CROWD_VERSION="$(cd $CLI_HOME && git describe --tags --abbrev=0)"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Trying to install ssl tools, need to get sudo privileges"
    apt install libnss3-tools
fi

if [[ "$IS_DEV" = false ]]; then
    cp $CLI_HOME/backend/.env.dist $CLI_HOME/backend/.env
    cp $CLI_HOME/frontend/.env.dist $CLI_HOME/frontend/.env
fi

sed -i -e "s|PROJECT_ROOT=.*|PROJECT_ROOT=\'$CLI_HOME\'|g" $CLI_HOME/backend/.env

cp $CLI_HOME/docker/docker-compose.default.yaml $CLI_HOME/docker/docker-compose.yaml
cp $CLI_HOME/docker/docker-compose.dev.default.yaml $CLI_HOME/docker/docker-compose.dev.yaml

docker pull crowddotdev/conversations:$CROWD_VERSION-dev
docker pull crowddotdev/lambda-py-packages:$CROWD_VERSION-dev
docker pull crowddotdev/backend:$CROWD_VERSION-dev
docker pull crowddotdev/frontend:$CROWD_VERSION-dev

cd $CLI_HOME/nginx/ssl && bash init-certs.sh

export CROWD_VERSION=$CROWD_VERSION

echo $IS_DEV
if [[ "$IS_DEV" = false ]]; then
    cd $CLI_HOME/docker && docker-compose -p crowd up --force-recreate
else
    cd $CLI_HOME && bash $CLI_HOME/backend/util/install-all.sh
    cd $CLI_HOME/docker && docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml -p crowd up --force-recreate
fi
