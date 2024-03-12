/**
 * Util to transform the attributes form model into the object model for the request
 */
export default (attributes, model) => attributes.reduce(
  (obj, attribute) => {
    if (
      model.attributes?.[attribute.name]?.default === undefined
      || model.attributes?.[attribute.name]?.default === null
      || model.attributes?.[attribute.name]?.default === ''
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
        ...(
          model[attribute.name] !== model.attributes[attribute.name].default
          && {
            custom: model[attribute.name],
            default: model[attribute.name],
          }),
      },
    };
  },
  {
    ...model.attributes,
  },
);
