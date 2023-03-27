/**
 * Util to transform extract the default property from attributes and create a new object
 */
export default (record) => Object.entries(record?.attributes || {}).reduce(
  (obj, [key, val]) => {
    if (
      val.default === undefined
        || val.default === null
        || key === 'emails'
    ) {
      return obj;
    }

    return {
      ...obj,
      [key]: val.default,
    };
  },
  {},
);
