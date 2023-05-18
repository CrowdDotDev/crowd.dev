#!/usr/bin/env bash

if [[ ${TERM} == "" || ${TERM} == "dumb" ]]; then
    RED=""
    GREEN=""
    GREY=""
    YELLOW=""
    RESET=""
else
    RED=`tput setaf 1`
    GREEN=`tput setaf 2`
    GREY=`tput setaf 7`
    YELLOW=`tput setaf 3`
    RESET=`tput sgr0`
fi

USER_NAME=`whoami`

yell () {
    printf "${YELLOW}$1\n${RESET}"
}

say () {
    printf "${GREEN}$1\n${RESET}"
}

whisper () {
    printf "${GREY}$1\n${RESET}"
}

error () {
    printf "${RED}$1\n${RESET}"
}

progress () {
    printf "  > $1\n"
}

nl () {
    printf "\n"
}
