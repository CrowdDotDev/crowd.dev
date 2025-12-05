#!/bin/bash

PIPES_FOLDER="../pipes"
DATA_SOURCES_FOLDER="../datasources"

# Parse command line arguments
SEQUENTIAL=false
[[ "$1" == "--sequential" ]] && SEQUENTIAL=true

format_files_in_folder() {
  local folder="$1"
  for file in "$folder"/*; do
    if [ -f "$file" ]; then
      if [ "$SEQUENTIAL" = true ]; then
        tb fmt --yes "$file"
      else
        tb fmt --yes "$file" &
      fi
    fi
  done
}

format_files_in_folder "$PIPES_FOLDER"
format_files_in_folder "$DATA_SOURCES_FOLDER"

# Only wait for background processes in parallel mode
[ "$SEQUENTIAL" = false ] && wait
