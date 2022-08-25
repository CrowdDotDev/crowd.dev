#!/usr/bin/bash

# This script should be in ~ubuntu/deploy/ of the backend machines.
# It will prepare the installation in a pre-dist directory,
# and once ready it will replace the current one.
# It keeps previous installation in the deploy/prev-dist[-prod] directory
#
# Call as
#
# ./deploy.sh -prod
#
# to deploy to production.  Without the -prod flag it deploys to test.


DIR=dist$1
PREDIR=pre-$DIR

if [ -d "$PREDIR" ]; then
    echo "Preparing $PREDIR"
else
    echo "$PREDIR not available"
    exit 1
fi

cd $PREDIR ; npm install --force; cd ..

# NOW=`date +%Y-%m-%d-%H%M%S`
# NOWDIR="past$1/$DIR-$NOW"
PREV="prev-$DIR"
rm -rf $PREV
mv $DIR $PREV
mv $PREDIR $DIR

echo "Installed $DIR"
echo "Saved previous installation as $PREV"

# This should achieve 0 downtime, but does not kill the process.
# Do pm2 restart anton or pm2 restart anton-production to do a
# proper restart.
pm2 reload anton$1
