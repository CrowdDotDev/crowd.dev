"""
This script generates a Tinybird datasource definition file from a given SQL file.

Invoke it with the name of the SQL DDL file you want to convert to a TinyBird .datasource file.

It reads the SQL file, extracts the datasource name, and generates a Tinybird
datasource definition file with the same name and the SQL query from the file.

Example:

Given the following SQL:

CREATE TABLE public."githubRepos" (
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"tenantId" uuid NOT NULL,
	"integrationId" uuid NOT NULL,
	"segmentId" uuid NOT NULL,
	url varchar(1024) NOT NULL,
	"maintainerFile" text NULL,
	"lastMaintainerRunAt" timestamptz NULL,
	"deletedAt" timestamp NULL,
	CONSTRAINT "githubRepos_pkey" PRIMARY KEY (id),
	CONSTRAINT "githubRepos_tenantId_url_key" UNIQUE ("tenantId", url)
);

This should generate the following datasource definition file:


SCHEMA >
    `id` UUID `json:$.id`,
    `createdAt` DateTime64(3) `json:$.createdAt`,
    `updatedAt` DateTime64(3) `json:$.updatedAt`,
    `tenantId` UUID `json:$.tenantId`,
    `integrationId` UUID `json:$.integrationId`,
    `segmentId` UUID `json:$.segmentId`,
    `url` String `json:$.url`,
    `maintainerFile` Nullable(String) `json:$.maintainerFile`,
    `lastMaintainerRunAt` Nullable(DateTime64(3)) `json:$.lastMaintainerRunAt`,
    `deletedAt` Nullable(DateTime64(3)) `json:$.deletedAt`

ENGINE ReplacingMergeTree
ENGINE_PARTITION_KEY toYear(createdAt)
ENGINE_SORTING_KEY sourceId
ENGINE_VER updatedAt
"""

import os
import re

# SQL data types to Tinybird data types mapping
sql_to_tinybird_types = {
    'uuid': 'UUID',
    'timestamp': 'DateTime64(3)',
    'timestamptz': 'DateTime64(3)',
    'varchar': 'String',
    'text': 'String',
    'int': 'Int32',
    'bigint': 'Int64',
    'boolean': 'Boolean',
}

def generate_datasource_definition(sql):
    # Extract the datasource name from the SQL file
    datasource_name = re.search(r'CREATE TABLE public\."(\w+)"', sql).group(1)
    datasource_name = datasource_name.lower()

    # Get each line that contains a column definition and split it into a list
    lines = sql.split('\n')
    columns = []

    # Extract the column name, its type, default value, and whether it is nullable
    for line in lines:
        if line.strip().startswith('`'):
            column_definition = line.split(' ')
            column_name = column_definition[0].strip('`')
            column_type = column_definition[1]
            default_value = None
            is_nullable = False

            # Check if there is a default value
            if 'DEFAULT' in column_definition:
                default_index = column_definition.index('DEFAULT')
                default_value = ' '.join(column_definition[default_index + 1:])

            # Check if the column is nullable
            if 'NULL' in column_definition:
                is_nullable = True

            # Add the column definition to the list
            columns.append((column_name, column_type, default_value, is_nullable))

    contents = [
    "SCHEMA >"
    ]

    # Generate the schema definition for each column
    for column in columns:
        column_name, column_type, default_value, is_nullable = column
        tinybird_type = sql_to_tinybird_types.get(column_type)
        nullable_str = 'Nullable(' + tinybird_type + ')' if is_nullable else tinybird_type
        contents.append(f"    `{column_name}` {nullable_str} `json:$.{column_name}`,")

    contents.append("\nENGINE ReplacingMergeTree")
    contents.append("ENGINE_PARTITION_KEY toYear(createdAt)")
    contents.append("ENGINE_SORTING_KEY sourceId")
    contents.append("ENGINE_VER updatedAt")

    # Write the datasource definition to a file with the same name as the SQL file
    datasource_file_path = f'{datasource_name}.datasource'
    with open(datasource_file_path, 'w') as datasource_file:
        datasource_file.write('\n'.join(contents))

    print(f'Datasource definition file generated: {datasource_file_path}')

# Main function
if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        print("Usage: python generate_datasource.py <sql_file>")
        sys.exit(1)

    sql_file_path = sys.argv[1]
    with open(sql_file_path, 'r') as sql_file:
        sql = sql_file.read()

    generate_datasource_definition(sql)
