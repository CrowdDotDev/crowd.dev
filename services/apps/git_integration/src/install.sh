#!/usr/bin/env bash

set -eu -o pipefail

sudo apt update
sudo apt upgrade -y
sudo apt install -y python3-pip
sudo apt install -y python-is-python3
sudo apt install -y python3-venv
sudo mkdir -p /data
sudo chown ubuntu /data
mkdir -p /data/repos/log
mkdir -p ~/venv/cgit && python -m venv ~/venv/cgit
source ~/venv/cgit/bin/activate
pip install --upgrade pip
cd ~/git-integration
pip install -e .

# Move one directory up from the git-integration folder
cd ~

# Check if git-integration-environment folder exists
if [ ! -d "git-integration-environment" ]; then
  git clone git@github.com:CrowdDotDev/git-integration-environment.git
else
  # Pull the latest changes from git-integration-environment repository if it exists
  cd git-integration-environment
  git pull origin main
  cd ~
fi

# Move back into the git-integration folder
cd ~

if [ "$1" == "prod" ]; then
  # Copy the dotenv-prod file as .env, replacing it if it already exists
  cp -f ~/git-integration-environment/dotenv-prod .env
  cp -f ~/git-integration-environment/dotenv-prod git-integration/.env
  echo "The dotenv-prod file has been copied as .env"
else
  # Copy the dotenv-staging file as .env, replacing it if it already exists
  cp -f ~/git-integration-environment/dotenv-staging .env
  cp -f ~/git-integration-environment/dotenv-staging git-integration/env
  echo "The dotenv-staging file has been copied as .env"
fi

echo "Setting up cron job"
# Create a temporary file
touch tmp-cron

# Check if the user has a crontab
if crontab -l >/dev/null 2>&1; then
  # If the cron jobs already exist, skip adding
  if crontab -l | grep -q "/home/ubuntu/venv/cgit/bin/crowd-git-ingest" && crontab -l | grep -q "/home/ubuntu/venv/cgit/bin/crowd-git-maintainers"; then
    echo "Cron jobs already exist. Nothing to do."
    rm tmp-cron
    exit 0
  fi

  # Save the current crontab into a temporary file
  crontab -l >tmp-cron
fi

# Append the new cron job entries
echo "0 */5 * * * /home/ubuntu/venv/cgit/bin/crowd-git-ingest >> /data/repos/log/cron.log 2>&1" >>tmp-cron
echo "0 0 * * * /home/ubuntu/venv/cgit/bin/crowd-git-maintainers >> /data/repos/log/maintainers.log 2>&1" >>tmp-cron

# Install the new crontab
crontab tmp-cron

# Remove the temporary file
rm tmp-cron

echo "Cron jobs added successfully."
