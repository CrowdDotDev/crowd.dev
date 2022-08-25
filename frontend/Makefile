
build-test:
	npm run build:staging

build-prod:
	npm run build:production

pull:
	git pull

deploy:	pull build-test
	wrangler publish

deploy-prod:	pull build-prod
	wrangler publish --env production
