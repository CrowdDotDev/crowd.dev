#!/usr/bin/env bash

set -euo pipefail

TAG="sjc.ocir.io/axbydjxa5zuh/kafka-connect:$(date +%s)"
readonly TAG

docker build -t "${TAG}" .

echo "----------------------------------------"
echo "Image built with tag: ${TAG}"
echo "----------------------------------------"
echo -n "Type 'y' and press Enter to push the image to the registry. Ctrl+C to cancel: "
read -r PUSH
if [ "${PUSH}" = "y" ]; then
    echo "Pushing image to the registry..."
    echo "----------------------------------------"
    docker push "${TAG}"
else
    echo "Skipping push"
fi
