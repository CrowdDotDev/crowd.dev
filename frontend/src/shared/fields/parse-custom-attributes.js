export default (attributes) => {
  return Object.values(attributes)
    .filter(
      (attribute) => attribute.canDelete && attribute.show
    )
    .reduce(
      (obj, attribute) => ({
        ...obj,
        [attribute.name]: attribute
      }),
      {}
    )
}
