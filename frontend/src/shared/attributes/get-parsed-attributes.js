/**
 * Util to transform the attributes form model into the object model for the request
 */
export default (attributes, model) => attributes.reduce(
  (obj, attribute) => {
    if (model[attribute.name]) {
      return {
        ...obj,
        [attribute.name]: {
          ...model.attributes[attribute.name],
          ...(
            model[attribute.name] !== model.attributes[attribute.name]?.default
            && {
              custom: model[attribute.name],
              default: model[attribute.name],
            }),
        },
      };
    }

    return {
      ...obj,
      ...model.attributes[attribute.name] && { [attribute.name]: undefined },
    };
  },
  {
    ...model.attributes,
  },
);
