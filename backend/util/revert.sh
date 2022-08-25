#!/usr/bin/bash

# This script should be in ~ubuntu/deploy/ of the backend machines.
# It will revert to the previous installation kept in the
# deploy/prev-dist[-prod] directory
#
# Call as
#
# ./revert.sh -prod
#
# to revert production.  Without the -prod flag reverts test.


DIR=dist$1
PREV="prev-$DIR"
FAIL="fail-$DIR"

if [ -d "$PREV" ]; then
    echo "About to revert to $PREV"
else
    echo "$PREDIR not available"
    exit 1
fi

rm -rf $FAIL
mv $DIR $FAIL
mv $PREV $DIR

echo "Reverted in $DIR"
echo "Saved previous installation as $FAIL"

# This should achieve 0 downtime, but does not kill the process.
# Do pm2 restart anton or pm2 restart anton-production to do a
# proper restart.
pm2 reload anton$1
