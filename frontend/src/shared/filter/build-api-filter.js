export default (filter) => {
  return {
    [filter.operator]: Object.values(
      filter.attributes
    ).reduce((acc, item) => {
      acc.push(_buildAttributeBlock(item))
      return acc
    }, [])
  }
}

function _buildAttributeBlock(attribute) {
  let rule = {}
  if (attribute.operator === 'contains') {
    rule = {
      [attribute.custom ? 'jsonContains' : 'textContains']:
        attribute.value
    }
  } else if (attribute.operator === 'between') {
    rule = {
      between: attribute.value
    }
  } else if (attribute.operator === null) {
    rule = Array.isArray(attribute.value)
      ? attribute.value.map((o) => o.id || o.value)
      : attribute.value
  } else {
    rule = {
      [attribute.operator]: attribute.value.map(
        (o) => o.id || o.value
      )
    }
  }

  return {
    [attribute.custom
      ? `attributes.${attribute.name}`
      : attribute.name]: rule
  }
}
