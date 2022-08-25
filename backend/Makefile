SSH=crowd-aws --call-in=public
RSYNC=crowd-aws --send-to-public

build:
	npm run build

set-environment-staging:
	npm run build:setenv:staging

set-environment-prod:
	npm run build:setenv:prod

send-deploy:
	$(RSYNC) util/deploy.sh deploy/

pull:
	git pull


deploy-all:    deploy deploy-serverless	

deploy-all-prod:   deploy-prod deploy-serverless-prod

deploy-serverless:
	cd src/serverless/integrations && npm run sls-deploy
	cd src/serverless/dbOperations && npm run sls-deploy
	cd src/serverless/microservices/nodejs && npm run sls-deploy
	cd src/serverless/microservices/python/serverless && npm run sls-deploy

deploy-serverless-prod:
	cd src/serverless/integrations && npm run sls-deploy-prod
	cd src/serverless/dbOperations && npm run sls-deploy-prod
	cd src/serverless/microservices/nodejs && npm run sls-deploy-prod
	cd src/serverless/microservices/python/serverless && npm run sls-deploy-prod

deploy:	pull send-deploy build set-environment-staging
	echo "Deploying staging"
	$(RSYNC) dist/ deploy/pre-dist/
	$(SSH) "cd deploy ; ./deploy.sh"

deploy-prod:	pull send-deploy build set-environment-prod
	echo "Deploying production"
	$(RSYNC) dist/ deploy/pre-dist-prod/
	$(SSH) "cd deploy ; ./deploy.sh -prod"

remote-install:
	$(RSYNC) server-config/ conf/
	$(SSH) "cd conf/nginx ; sudo ./setup.sh"
	$(SSH) "pm2 reload conf/pm2.config.js"

pm2-status:
	$(SSH) "pm2 list"

nginx-status:
	$(SSH) "systemctl status nginx"

status:	pm2-status nginx-status
