#!/usr/bin/env bash

set -euo pipefail

TAG="sjc.ocir.io/axbydjxa5zuh/kafka-connect:$(date +%s)"
readonly TAG

function download_dependencies() {
	mkdir -p tmp
	pushd tmp

	if [[ ! -d kafka-connect-http ]]; then
		echo "Downloading kafka-connect-http"
		wget -q "https://github.com/lensesio/stream-reactor/releases/download/8.1.30/kafka-connect-http-8.1.30.zip"
		unzip kafka-connect-http-8.1.30.zip -d kafka-connect-http
	else
		echo "kafka-connect-http already downloaded"
	fi

	if [[ ! -d questdb-connector ]]; then
		echo "Downloading questdb-connector"
		wget -q "https://github.com/questdb/kafka-questdb-connector/releases/download/v0.14/kafka-questdb-connector-0.14-bin.zip"
		unzip kafka-questdb-connector-0.14-bin.zip -d questdb-connector
	else
		echo "questdb-connector already downloaded"
	fi

	popd
}

function main() {
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
}

download_dependencies
main
