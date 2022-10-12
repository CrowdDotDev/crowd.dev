export default (filter) => {
  if (Object.keys(filter).length === 0) {
    return {}
  } else {
    return {
      [filter.operator]: Object.values(
        filter.attributes
      ).reduce((acc, item) => {
        if (
          Array.isArray(item.value)
            ? item.value.length > 0
            : item.value !== '' && item.value !== null
        ) {
          acc.push(_buildAttributeBlock(item))
        }

        return acc
      }, [])
    }
  }
}

function _buildAttributeBlock(attribute) {
  let rule = {}

  if (attribute.name === 'score') {
    return {
      or: [
        attribute.value.map((option) => {
          return {
            score: {
              between: option.value
            }
          }
        })
      ]
    }
  } else if (attribute.name === 'search') {
    return {
      or: [
        {
          displayName: {
            textContains: attribute.value
          }
        },
        {
          email: {
            textContains: attribute.value
          }
        },
        {
          'username.default': {
            textContains: attribute.value
          }
        }
      ]
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
      [attribute.operator]: Array.isArray(attribute.value)
        ? attribute.value.map((o) => o.id || o.value)
        : attribute.value
    }
  }

  return {
    [attribute.custom
      ? `attributes.${attribute.name}.default`
      : attribute.name]: rule
  }
}
