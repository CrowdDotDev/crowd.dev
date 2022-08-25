# This is intended to be used within the venv-admin virtual environment
# defined in crowd-web that installs crowd.admin
#
# Assuming that core and  crowd-web are in the same directory do and that
# you have installed the virtualenv in crowd-web/venv-admin do
#
# source ../../crowd-web/venv-admin/bin/activate
#

githooks:
	cp hooks/* .git/hooks
	chmod u+x .git/hooks/*

get-latest-db:
	docker-compose down --volumes
	docker-compose -f docker-compose-test.yaml down --volumes
	docker-compose pull
	docker-compose up -d

