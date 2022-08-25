#!/usr/bin/bash
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
       ./mkcert -install && ./mkcert anton.localhost app.localhost cubejs.localhost open.localhost localstack
elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac OSX
        brew install mkcert && brew install nss && mkcert -install && mkcert anton.localhost app.localhost cubejs.localhost open.localhost localstack
else
    echo 'unsupported os'
fi