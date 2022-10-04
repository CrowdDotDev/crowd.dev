export default (option, query) => {
  return (
    (option.name
      .toLowerCase()
      .includes(query.toLowerCase()) ||
      option.label
        .toLowerCase()
        .includes(query.toLowerCase())) &&
    option.show !== false
  )
}
