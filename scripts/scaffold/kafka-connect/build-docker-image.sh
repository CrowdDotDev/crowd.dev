#!/usr/bin/env bash


if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	set -euo pipefail
fi

TAG="sjc.ocir.io/axbydjxa5zuh/kafka-connect:$(date +%s)"
readonly TAG

function download_kafka_connect_http() {
	local base_dir="${1:-.}"
	mkdir -p ${base_dir}/tmp

	if [[ (
        ! -d "${base_dir}/tmp/kafka-connect-http" ||
        -z "$(ls -A "${base_dir}/tmp/kafka-connect-http")" ||
        ! -d "${base_dir}/tmp/kafka-connect-http/kafka-connect-http-8.1.28" ||
        -z "$(ls -A "${base_dir}/tmp/kafka-connect-http/kafka-connect-http-8.1.28")") ]] \
        ; then
		
		echo "Downloading kafka-connect-http"
		wget -q "https://github.com/lensesio/stream-reactor/releases/download/8.1.28/kafka-connect-http-8.1.28.zip" -O $base_dir/tmp/kafka-connect-http.zip
		unzip $base_dir/tmp/kafka-connect-http.zip -d "${base_dir}/tmp/kafka-connect-http"
		rm $base_dir/tmp/kafka-connect-http.zip

	else
		echo "kafka-connect-http already downloaded"
	fi
}

function download_kafka_connect_questdb_connector() {
	local base_dir="${1:-.}"
	mkdir -p ${base_dir}/tmp


	if [[ (
        ! -d "${base_dir}/tmp/questdb-connector" ||
        -z "$(ls -A "${base_dir}/tmp/questdb-connector")" ||
        ! -d "${base_dir}/tmp/questdb-connector/kafka-questdb-connector" ||
        -z "$(ls -A "${base_dir}/tmp/questdb-connector/kafka-questdb-connector")") ]] \
        ; then
		
		echo "Downloading questdb-connector"
		wget -q "https://github.com/questdb/kafka-questdb-connector/releases/download/v0.14/kafka-questdb-connector-0.14-bin.zip" -O $base_dir/tmp/kafka-connect-questdb-connector.zip
		unzip $base_dir/tmp/kafka-connect-questdb-connector.zip -d "${base_dir}/tmp/questdb-connector"
		rm $base_dir/tmp/kafka-connect-questdb-connector.zip

	else
		echo "questdb-connector already downloaded"
	fi
}



function download_dependencies() {
	download_kafka_connect_http
	download_kafka_connect_questdb_connector
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

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  download_dependencies
  main
fi