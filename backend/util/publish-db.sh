#!/usr/bin/bash

# Gets the current db dump from local docker image
# Builds a new image using the new db dump
# Publishes the new image to docker.hub with given tag as argument
# Instead of running as is, npm script db:publish can be used as well
# NPM Script db:publish usage:
# `npm run db:publish -- latest` (for x86-64 images)
# `npm run db:publish -- latest-arm` (for M1 chip arm images)

# Usage:
#  bash ./util/publish-db latest
# * param1: Image tag to be pushed to docker.hub 

if [ "$1" ]
then
    cd docker && docker-compose up -d
    echo 'Started getting db dump. This may take a while...'
    echo 'localhost:5432:crowd-web:postgres:example' > ~/.pgpass && chmod 600 ~/.pgpass && pg_dump --host localhost --port 5432 --username postgres --format plain crowd-web -f staging_dump
    echo 'Dump complete! \n Building the docker image out of dump...'
    docker build -f ./Dockerfile-db-latest -t anilbostanci/crowd-db-staging:$1 .
    docker push anilbostanci/crowd-db-staging:$1
    rm staging_dump
else
    echo "Provide a docker tag for built db image as an argument"
fi

