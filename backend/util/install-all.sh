
#!/usr/bin/bash

pushd backend
npm ci
popd

pushd backend/src/serverless/integrations
npm ci
npm run sls-webpack
popd

pushd backend/src/serverless/dbOperations
npm ci
npm run sls-webpack
popd

pushd backend/src/serverless/microservices/nodejs
npm ci
npm run sls-webpack
popd

pushd ../premium/conversations
npm ci
popd

python3.8 -m venv venv-crowd
source venv-crowd/bin/activate
pip install --upgrade pip 

pushd backend/src/serverless/microservices/python
pip install -r requirements.txt
pip install -r requirements.dev.txt
popd

pushd backend/src/serverless/microservices/python/serverless
npm ci
popd