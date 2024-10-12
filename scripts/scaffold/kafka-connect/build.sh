#!/usr/bin/env bash

set -euo pipefail

TAG="sjc.ocir.io/axbydjxa5zuh/kafka-connect:$(date +%s)"
readonly TAG

docker build -t "${TAG}" .
docker push "${TAG}"
