#!/bin/bash

PIPES_FOLDER="../pipes"
DATA_SOURCES_FOLDER="../datasources"

format_files_in_folder() {
  local folder="$1"
  for file in "$folder"/*; do
    [ -f "$file" ] && tb fmt --yes "$file" &
  done
}

format_files_in_folder "$PIPES_FOLDER"
format_files_in_folder "$DATA_SOURCES_FOLDER"

wait
