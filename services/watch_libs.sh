#!/bin/bash

set -e

CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
source $CLI_HOME/../scripts/utils

# Define dependencies as an associative array
declare -A DEPENDENCIES

DEPENDENCIES=(
  ["common"]=""
  ["types"]=""
  ["logging"]="common"
  ["redis"]="common logging types"
  ["database"]="common logging"
  ["sqs"]="common logging types"
  ["integrations"]="common logging types"
)

function build_package() {
  local package=$1
  say "Building package: $package"
  (cd "$CLI_HOME/libs/$package" && npm run build && say "Package built: $package!")
}

function install_package() {
  local package=$1
  say "Installing dependencies for package: $package"
  (cd "$CLI_HOME/libs/$package" && npm install && say "Package dependencies installed: $package!")
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
  local package_path="$CLI_HOME/libs/$package"

  npx chokidar-cli "${package_path}/src/**/*.ts" --ignore-initial --ignore "*.dist/*" -c "echo 'File change detected in src: {event} {path}' && $0 build_package $package && $0 build_dependent_packages $package"
}

function watch_package_json() {
  local package=$1
  local package_path="$CLI_HOME/libs/$package"

  npx chokidar-cli "${package_path}/package.json" --ignore-initial -c "echo 'File change detected in package.json: {event} {path}' && $0 install_package $package && $0 build_package $package && $0 build_dependent_packages $package"
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
    *)
      echo "Unknown command: $command"
      exit 1
      ;;
  esac

  exit 0
fi

for library_path in "$CLI_HOME/libs/"*; do
  if [ -d "$library_path" ] && [ -f "$library_path/package.json" ]; then
    library=$(basename "$library_path")
    say "Watching library: $library"
    watch_src_files "$library" &
    watch_package_json "$library" &
  fi
done

# Wait for all background tasks to complete
wait
