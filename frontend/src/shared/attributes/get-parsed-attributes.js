/**
 * Util to transform the attributes form model into the object model for the request
 */
export default (attributes, model) => {
  return attributes.reduce((obj, attribute) => {
    if (
      model[attribute.name] === undefined ||
      model[attribute.name] === null
    ) {
      return obj
    }

    return {
      ...obj,
      [attribute.name]: {
        ...model.attributes[attribute.name],
        default: model[attribute.name]
      }
    }
  }, {})
}
