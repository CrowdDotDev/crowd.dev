#!/bin/bash

set -euo pipefail

# Configuration
copy_pipe="activities_with_relations_merged_copy_pipe"
max_rows=1000000

default_start_datetime="2025-01-01 00:00:00"
default_end_datetime=$(date +"%Y-%m-%d 23:59:59")
start_datetime="${1:-$default_start_datetime}"
end_datetime="${2:-$default_end_datetime}"


log_file="copied_ranges.log"
parallel_jobs=5

mkdir -p "$(dirname "$log_file")"
touch "$log_file"

has_been_processed() {
    grep -qF "$1|$2" "$log_file"
}

function mark_as_processed() {
    local start="$1"
    local end="$2"
    local count="$3"
    echo "$start|$end|$count" >>"$log_file"
}

get_row_count() {
    local start="$1"
    local end="$2"

    tb sql "SELECT count(id) FROM (SELECT id FROM activities_deduplicated_ds) a inner JOIN (SELECT activityId FROM activityRelations_deduplicated_ds where updatedAt >= '$start' AND updatedAt < '$end' ) ar ON ar.activityId = a.id" \
        --format csv \
        --rows_limit 1 2>/dev/null \
        | sed -n '5p' \
        | tr -d '[:space:]'
}

copy_range() {
    local start="$1"
    local end="$2"
    local depth="$3"

    if has_been_processed "$start" "$end"; then
        echo "Already processed: $start → $end"
        return
    fi

    local row_count=$(get_row_count "$start" "$end")

    if ! [[ "$row_count" =~ ^[0-9]+$ ]]; then
        echo "ERROR: Invalid row count '$row_count' for $start → $end"
        row_count=0
    fi

    echo "🔍 $start → $end → ~${row_count} rows"

    if [ "$row_count" -eq 0 ]; then
        echo "No rows found for $start → $end, skipping copy." >&2
        mark_as_processed "$start" "$end" "$row_count"
        return
    fi

    if [ "$row_count" -le "$max_rows" ] || [ "$depth" -ge 2 ]; then
        if [ "$row_count" -gt "$max_rows" ]; then
            echo "Too many rows at minute level. Copying anyway."
        else
            echo "Copying $start to $end" >&2
        fi

        tb pipe copy run \
            --param start="$start" \
            --param end="$end" \
            --mode=append \
            --yes "$copy_pipe" \
            --wait >&2

        mark_as_processed "$start" "$end" "$row_count"
    else
        local step_seconds=$([ "$depth" -eq 0 ] && echo 3600 || echo 60)
        local start_ts=$(date -d "$start" +%s)
        local end_ts=$(date -d "$end" +%s)

        while [ "$start_ts" -lt "$end_ts" ]; do
            local next_ts=$((start_ts + step_seconds))
            [ "$next_ts" -gt "$end_ts" ] && next_ts=$end_ts

            local sub_start=$(date -d "@$start_ts" +"%Y-%m-%d %H:%M:%S")
            local sub_end=$(date -d "@$next_ts" +"%Y-%m-%d %H:%M:%S")

            copy_range "$sub_start" "$sub_end" $((depth + 1))

            start_ts=$next_ts
        done
    fi
}

export -f has_been_processed mark_as_processed get_row_count copy_range
export copy_pipe max_rows log_file

# Generate list of daily ranges
ranges=()
current_ts=$(date -d "$start_datetime" +%s)
end_ts=$(date -d "$end_datetime" +%s)

while [ "$current_ts" -lt "$end_ts" ]; do
    next_ts=$((current_ts + 86400))

    day_start=$(date -d "@$current_ts" +"%Y-%m-%d 00:00:00")
    day_end=$(date -d "@$next_ts" +"%Y-%m-%d 00:00:00")

    ranges+=("$day_start|$day_end")

    current_ts=$next_ts
done

# Parallel execution with GNU Parallel
printf "%s\n" "${ranges[@]}" | parallel --line-buffer -j "$parallel_jobs" --colsep '\|' copy_range "{1}" "{2}" 0
