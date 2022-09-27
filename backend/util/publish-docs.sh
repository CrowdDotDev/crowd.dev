#!/usr/bin/bash
npx openapi-comment-parser . openapi.json
npx rdme openapi openapi.json --version=v1.0.0 --key=$1