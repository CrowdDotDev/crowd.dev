#!/bin/bash

set -e

CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source $CLI_HOME/utils.sh

SERVICE=""
SERVICE_FLAG=""
for ((i=1; i<=$#; i++)); do
  if [ "${!i}" == "--service" ]; then
    ((i++))
    SERVICE="${!i}"
    SERVICE_FLAG="--service $SERVICE"
    break
  fi
done

$(npx --yes chokidar-cli --version >/dev/null 2>&1)

# Define dependencies as an associative array
declare -A DEPENDENCIES

DEPENDENCIES=(
  ["common"]=""
  ["types"]=""
  ["logging"]="common"
  ["redis"]="common logging types"
  ["database"]="common logging"
  ["sqs"]="common logging types"
  ["sentiment"]="logging"
  ["conversations"]="common logging types database"
  ["integrations"]="common logging types"
  ["alerting"]=""
  ["opensearch"]="types"
)

function touch_services() {
  if [ ! -z "$SERVICE" ]; then
    say "Touching service $SERVICE to trigger restart!"
    service_path="$CLI_HOME/../apps/$SERVICE"
    touch "$service_path/src/main.ts"
  else
    for service_path in "$CLI_HOME/../apps/"*; do
      if [ -d "$service_path" ] && [ -f "$service_path/package.json" ]; then
        service=$(basename "$service_path")
        say "Touching service $service to trigger restart!"
        touch "$service_path/src/main.ts"
      fi
    done
  fi
}

function build_package() {
  local package=$1
  yell "Building package: $package"
  (cd "$CLI_HOME/../libs/$package" && npm run build && say "Package built: $package!")
}

function install_package() {
  local package=$1
  yell "Installing dependencies for package: $package"
  (cd "$CLI_HOME/../libs/$package" && npm install && say "Package dependencies installed: $package!")
}

function build_dependent_packages() {
  local package=$1

  for dependent_package in "${!DEPENDENCIES[@]}"; do
    local dependencies_array=(${DEPENDENCIES[$dependent_package]})

    if [[ " ${dependencies_array[@]} " =~ " ${package} " ]]; then
      build_package "$dependent_package"
      build_dependent_packages "$dependent_package"
    fi
  done
}

function watch_src_files() {
  local package=$1
  local package_path="$CLI_HOME/../libs/$package"

  npx chokidar-cli "${package_path}/src/**/*.ts" --ignore-initial --ignore "*.dist/*" -c "echo 'File change detected in src: {event} {path}' && $0 build_package $package && $0 build_dependent_packages $package && $0 touch_services $SERVICE_FLAG"
}

function watch_package_json() {
  local package=$1
  local package_path="$CLI_HOME/../libs/$package"

  npx chokidar-cli "${package_path}/package.json" --ignore-initial -c "echo 'File change detected in package.json: {event} {path}' && $0 install_package $package && $0 build_package $package && $0 build_dependent_packages $package && $0 touch_services $SERVICE_FLAG"
}

function start() {
  for library_path in "$CLI_HOME/../libs/"*; do
    if [ -d "$library_path" ] && [ -f "$library_path/package.json" ]; then
      library=$(basename "$library_path")
      say "Watching library: $library"
      watch_src_files "$library" &
      watch_package_json "$library" &
    fi
  done

  # Wait for all background tasks to complete
  wait
}

if [ "$#" -gt 0 ]; then
  command=$1
  shift

  case $command in
    build_package)
      build_package "$@"
      ;;
    install_package)
      install_package "$@"
      ;;
    build_dependent_packages)
      build_dependent_packages "$@"
      ;;
    touch_services)
      touch_services
      ;;
    *)
      start
      ;;
  esac

  exit 0
fi

start