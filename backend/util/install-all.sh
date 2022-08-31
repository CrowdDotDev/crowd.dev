#!/bin/bash

CLI_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

pushd $CLI_HOME/..
npm ci
popd

pushd $CLI_HOME/../src/serverless/integrations
npm ci
npm run sls-webpack
popd

pushd $CLI_HOME/../src/serverless/dbOperations
npm ci
npm run sls-webpack
popd

pushd $CLI_HOME/../src/serverless/microservices/nodejs
npm ci
npm run sls-webpack
popd

pushd $CLI_HOME/../../premium/conversations
npm ci
popd

python3.8 -m venv venv-crowd
source venv-crowd/bin/activate
pip install --upgrade pip 

pushd $CLI_HOME/../src/serverless/microservices/python
pip install -r requirements.txt
pip install -r requirements.dev.txt
popd

pushd $CLI_HOME/../src/serverless/microservices/python/serverless
npm ci
popd