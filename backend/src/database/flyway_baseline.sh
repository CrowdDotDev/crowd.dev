#!/usr/bin/env bash

set -e
echo "Baselining jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}"

flyway \
    -locations="filesystem:/tmp/migrations" \
    -url="jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}" \
    -user="$PGUSER" \
    -password="$PGPASSWORD" \
    -connectRetries=60 \
    -outOfOrder=true \
    -placeholderReplacement=false\
    -schemas=public \
    -baselineVersion=1666966941 \
    -baselineDescription="initial" \
    baseline