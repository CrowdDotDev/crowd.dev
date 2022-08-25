
#!/usr/bin/bash
pushd src/serverless/integrations
npm ci
npm run sls-webpack
popd

pushd src/serverless/dbOperations
npm ci
npm run sls-webpack
popd

pushd src/serverless/microservices/nodejs
npm ci
npm run sls-webpack
popd

pushd ./../premium/conversations
npm ci
popd

python3.8 -m venv venv-crowd
source venv-crowd/bin/activate
pip install --upgrade pip 

pushd src/serverless/microservices/python
pip install -r requirements.txt
pip install -r requirements.dev.txt
popd

pushd src/serverless/microservices/python/serverless
npm ci
popd