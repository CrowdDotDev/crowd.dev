#!/bin/bash

# Ask for the new integration name
echo "Enter the new integration name (e.g youtube, meetup, etc.):"
read NEW_INTEGRATION_NAME

# Directory path
DIRECTORY=../libs/integrations/src/integrations/$NEW_INTEGRATION_NAME

# Check if the directory exists
if [ -d "$DIRECTORY" ]; then
  read -p "Directory $DIRECTORY already exists. Do you want to continue (files will be overwritten)? (y/n) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    echo "Aborting script."
    exit 1
  fi
fi

CAPITALIZED_INTEGRATION_NAME="$(tr '[:lower:]' '[:upper:]' <<< ${NEW_INTEGRATION_NAME:0:1})${NEW_INTEGRATION_NAME:1}"

UPPER_CASED_INTEGRATION_NAME="$(tr '[:lower:]' '[:upper:]' <<< $NEW_INTEGRATION_NAME)"

# Create the directory
mkdir -p $DIRECTORY

# Create the "api" directory inside the new integration directory
mkdir -p $DIRECTORY/api

GRID_CONTENT=$(cat << EOF
// grid.ts content
import { IActivityScoringGrid } from '@crowd/types'
import { ${CAPITALIZED_INTEGRATION_NAME}ActivityType } from './types'

export const ${CAPITALIZED_INTEGRATION_NAME}_GRID: Record<${CAPITALIZED_INTEGRATION_NAME}ActivityType, IActivityScoringGrid> = {
    // your code goes here
}

EOF
)

GENERATE_STREAMS_CONTENT=$(cat << EOF
// generateStreams.ts content
import { GenerateStreamsHandler } from '../../types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings
}

export default handler
EOF
)

INDEX_CONTENT=$(cat << EOF
// index.ts content
import { IIntegrationDescriptor } from '../../types'
import generateStreams from './generateStreams'
import { ${UPPER_CASED_INTEGRATION_NAME}_MEMBER_ATTRIBUTES } from './memberAttributes'
import processStream from './processStream'
import processData from './processData'
import { PlatformType } from '@crowd/types'

const descriptor: IIntegrationDescriptor = {
  type: PlatformType.${UPPER_CASED_INTEGRATION_NAME},
  memberAttributes: ${UPPER_CASED_INTEGRATION_NAME}_MEMBER_ATTRIBUTES,
  checkEvery: 60,
  generateStreams,
  processStream,
  processData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postProcess: (settings: any) => {
    return settings
  },
}

export default descriptor
EOF
)

MEMBER_CONTENT=$(cat << EOF
// memberAttributes.ts content
import {
  IMemberAttribute,
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
} from '@crowd/types'

export const ${UPPER_CASED_INTEGRATION_NAME}_MEMBER_ATTRIBUTES: IMemberAttribute[] = [
  {
    name: MemberAttributes[MemberAttributeName.SOURCE_ID].name,
    label: MemberAttributes[MemberAttributeName.SOURCE_ID].label,
    type: MemberAttributeType.STRING,
    canDelete: false,
    show: false,
  },
]
EOF
)

PROCESS_DATA_CONTENT=$(cat << EOF
// processData.ts content
import { ProcessDataHandler } from '../../types'

const handler: ProcessDataHandler = async (ctx) => {
  const data = ctx.data
}

export default handler
EOF
)

PROCESS_STREAM_CONTENT=$(cat << EOF
// processStream.ts content
import { ProcessStreamHandler } from '../../types'

const handler: ProcessStreamHandler = async (ctx) => {
  const streamIdentifier = ctx.stream.identifier
}

export default handler
EOF
)

TYPES_CONTENT=$(cat << EOF
// types.ts content
export enum ${CAPITALIZED_INTEGRATION_NAME}ActivityType {}
EOF
)

# Create all of the files with some basic content
echo "$GENERATE_STREAMS_CONTENT" > $DIRECTORY/generateStreams.ts
echo "$GRID_CONTENT" > $DIRECTORY/grid.ts
echo "$INDEX_CONTENT" > $DIRECTORY/index.ts
echo "$MEMBER_CONTENT" > $DIRECTORY/memberAttributes.ts
echo "$PROCESS_DATA_CONTENT" > $DIRECTORY/processData.ts
echo "$PROCESS_STREAM_CONTENT" > $DIRECTORY/processStream.ts
echo "$TYPES_CONTENT" > $DIRECTORY/types.ts

echo "Created new integration '$CAPITALIZED_INTEGRATION_NAME'"
