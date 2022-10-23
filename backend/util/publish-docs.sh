#!/usr/bin/bash
npx openapi-comment-parser . openapi.json
npx rdme openapi openapi.json --version=v0 --key=$1