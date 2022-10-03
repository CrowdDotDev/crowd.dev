#!/usr/bin/bash
CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

DOMAINS="anton.localhost app.localhost cubejs.localhost open.localhost"

if [[ ! -f "$CLI_HOME/crowd.localhost.pem" ]]; then
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        $CLI_HOME/mkcert -install >> /dev/null 2>&1
        $CLI_HOME/mkcert -cert-file $CLI_HOME/crowd.localhost.pem -key-file $CLI_HOME/crowd.localhost.key.pem $DOMAINS >> /dev/null 2>&1
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        which mkcert >> /dev/null
        if [[ $? -eq 1 ]]; then
            brew install mkcert && brew install nss
        fi

        mkcert -install >> /dev/null 2>&1
        mkcert -cert-file $CLI_HOME/crowd.localhost.pem -key-file $CLI_HOME/crowd.localhost.key.pem $DOMAINS >> /dev/null 2>&1
    else
        echo "Unsupported OS"
        exit 1
    fi
fi