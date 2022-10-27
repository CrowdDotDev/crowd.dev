#!/usr/bin/bash
npx openapi-comment-parser . openapi.json
npx rdme openapi openapi.json --key=$1 --id=6299c11fcb740e002310bae1