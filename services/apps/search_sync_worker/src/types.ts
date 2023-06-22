export enum OpenSearchIndex {
  MEMBERS = 'members',
}

export const OPENSEARCH_INDEX_MAPPINGS: Record<OpenSearchIndex, unknown> = {
  [OpenSearchIndex.MEMBERS]: {
    dynamic_templates: [
      // https://opensearch.org/docs/latest/field-types/supported-field-types/string/
      {
        strings: {
          match_pattern: 'regex',
          match: 'string_.*',
          path_match: '.*',
          mapping: {
            type: 'text',
          },
        },
      },
      {
        uuids: {
          match_pattern: 'regex',
          match: 'uuid_.*',
          path_match: '.*',
          mapping: {
            type: 'keyword',
          },
        },
      },
      // https://opensearch.org/docs/latest/field-types/supported-field-types/numeric/
      {
        integers: {
          match_pattern: 'regex',
          match: 'int_.*',
          path_match: '.*',
          mapping: {
            type: 'integer',
          },
        },
      },
      {
        floats: {
          match_pattern: 'regex',
          match: 'float_.*',
          path_match: '.*',
          mapping: {
            type: 'float',
          },
        },
      },
      {
        bytes: {
          match_pattern: 'regex',
          match: 'byte_.*',
          path_match: '.*',
          mapping: {
            type: 'byte',
          },
        },
      },
      {
        doubles: {
          match_pattern: 'regex',
          match: 'double_.*',
          path_match: '.*',
          mapping: {
            type: 'double',
          },
        },
      },
      {
        half_floats: {
          match_pattern: 'regex',
          match: 'half_float_.*',
          path_match: '.*',
          mapping: {
            type: 'half_float',
          },
        },
      },
      {
        longs: {
          match_pattern: 'regex',
          match: 'long_.*',
          path_match: '.*',
          mapping: {
            type: 'long',
          },
        },
      },
      {
        shorts: {
          match_pattern: 'regex',
          match: 'short_.*',
          path_match: '.*',
          mapping: {
            type: 'short',
          },
        },
      },
      // https://opensearch.org/docs/latest/field-types/supported-field-types/date/
      {
        dates: {
          match_pattern: 'regex',
          match: 'date_.*',
          path_match: '.*',
          mapping: {
            type: 'date',
            format:
              'strict_date_optional_time||strict_date_optional_time_nanos||epoch_millis||yyyy-MM-dd HH:mm:ssXXX||yyyy-MM-dd HH:mm:ssX||yyyy-MM-dd HH:mm:ss.SSS||yyyy-MM-dd HH:mm:ss.SS',
          },
        },
      },
      // https://opensearch.org/docs/latest/field-types/supported-field-types/boolean/
      {
        booleans: {
          match_pattern: 'regex',
          match: 'bool_.*',
          path_match: '.*',
          mapping: {
            type: 'boolean',
          },
        },
      },
      // https://opensearch.org/docs/latest/field-types/supported-field-types/object-fields/
      {
        objects: {
          match_pattern: 'regex',
          match: 'obj_.*',
          path_match: '.*',
          mapping: {
            type: 'object',
          },
        },
      },
      {
        nested_objects: {
          match_pattern: 'regex',
          match: 'nested_.*',
          path_match: '.*',
          mapping: {
            type: 'nested',
          },
        },
      },
      {
        string_arrays: {
          match_pattern: 'regex',
          match: 'string_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'text',
          },
        },
      },
      {
        integer_arrays: {
          match_pattern: 'regex',
          match: 'int_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'integer',
          },
        },
      },
      {
        float_arrays: {
          match_pattern: 'regex',
          match: 'float_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'float',
          },
        },
      },
      {
        byte_arrays: {
          match_pattern: 'regex',
          match: 'byte_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'byte',
          },
        },
      },
      {
        double_arrays: {
          match_pattern: 'regex',
          match: 'double_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'double',
          },
        },
      },
      {
        half_float_arrays: {
          match_pattern: 'regex',
          match: 'half_float_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'half_float',
          },
        },
      },
      {
        long_arrays: {
          match_pattern: 'regex',
          match: 'long_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'long',
          },
        },
      },
      {
        short_arrays: {
          match_pattern: 'regex',
          match: 'short_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'short',
          },
        },
      },
      {
        date_arrays: {
          match_pattern: 'regex',
          match: 'date_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'date',
            format:
              'strict_date_optional_time||epoch_millis||yyyy-MM-dd HH:mm:ssXXX||yyyy-MM-dd HH:mm:ssX||yyyy-MM-dd HH:mm:ss.SSS||yyyy-MM-dd HH:mm:ss.SS',
          },
        },
      },
      {
        boolean_arrays: {
          match_pattern: 'regex',
          match: 'bool_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'boolean',
          },
        },
      },
      {
        uuid_arrays: {
          match_pattern: 'regex',
          match: 'uuid_arr_.*',
          path_match: '.*',
          mapping: {
            type: 'keyword',
          },
        },
      },
    ],
  },
}
