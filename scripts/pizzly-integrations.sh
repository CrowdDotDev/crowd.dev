CLI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

function exportEnv() {
    # Key to uppercase
    KEY=$(echo $1 | tr '[:lower:]' '[:upper:]')
    if [[ $2 == "dist" ]]; then
        export $(cat $CLI_HOME/../backend/.env.dist.local | grep $KEY | xargs)
    else
        export $(cat $CLI_HOME/../backend/.env.override.local | grep $KEY | xargs)
    fi
}

function create_pizzly_integration() {
    # $1 to uppercase
    KEY=$(echo $1 | tr '[:lower:]' '[:upper:]')
    exportEnv "$KEY"

    # We need the client ID, secret and scopes to be set to create the integration
    clientId=$(env | grep -i CROWD_${KEY}_CLIENT_ID | awk -F '=' '{print $2}')
    clientSecret=$(env | grep -i CROWD_${KEY}_CLIENT_SECRET | awk -F '=' '{print $2}')
    scopes=$(env | grep -i CROWD_${KEY}_SCOPES | awk -F '=' '{print $2}')
    if [[ -z $clientId || -z $clientSecret || -z $scopes ]]; then
        printf "\nNot all $1 variables are set. Skipping Pizzly integration creation.\n"
        printf "The variables needed are: \n- CROWD_${KEY}_CLIENT_ID \n- CROWD_${KEY}_CLIENT_SECRET \n- CROWD_${KEY}_SCOPES"
        return
    else
        export PIZZLY_SECRET_KEY=$CROWD_PIZZLY_SECRET_KEY
        printf "\nCreating $1 Integration with client ID: $clientId"    
        npx pizzly config:create $1 $1 $clientId $clientSecret "$scopes"
    fi

}

function create_pizzly_integrations() {
    exportEnv "PIZZLY" "dist"
    integrations=$CROWD_PIZZLY_INTEGRATIONS
    IFS=',' read -ra INTEGRATIONS <<< "$integrations"

    for i in "${INTEGRATIONS[@]}"; do
        create_pizzly_integration "$i"
    done
}

create_pizzly_integrations