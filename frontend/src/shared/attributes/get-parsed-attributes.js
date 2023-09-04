/**
 * Util to transform the attributes form model into the object model for the request
 */
export default (attributes, model) => attributes.reduce(
  (obj, attribute) => {
    if (
      model[attribute.name] === undefined
        || model[attribute.name] === null
        || model[attribute.name] === ''
        || model[attribute.name].default === ''
    ) {
      return {
        ...obj,
        [attribute.name]: undefined,
      };
    }

    return {
      ...obj,
      [attribute.name]: {
        ...model.attributes[attribute.name],
        default: model[attribute.name],
        custom: model[attribute.name],
      },
    };
  },
  {
    ...model.attributes,
  },
);
