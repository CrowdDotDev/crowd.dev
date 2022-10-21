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
            : item.value !== '' &&
              item.value !== null &&
              item.value !== {}
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

  if (attribute.name === 'platform') {
    return {
      or: attribute.value.map((a) => {
        return {
          platform: a.value
        }
      })
    }
  } else if (attribute.name === 'sentiment') {
    return {
      'sentiment.label': {
        eq: attribute.value.map((a) => a.value).join('/')
      }
    }
  } else if (attribute.name === 'type') {
    return {
      and: [
        {
          [attribute.value.type]: attribute.value.key
        },
        {
          type: attribute.value.value
        }
      ]
    }
  } else if (attribute.name === 'search') {
    return {
      or: attribute.fields.map((f) => {
        return {
          [f]: {
            textContains: attribute.value
          }
        }
      })
    }
  } else if (attribute.operator === 'notContains') {
    return {
      not: {
        [attribute.custom
          ? `attributes.${attribute.name}.default`
          : attribute.name]: {
          textContains: attribute.value
        }
      }
    }
  } else if (attribute.name === 'score') {
    rule = {
      in: attribute.value.reduce((acc, option) => {
        for (const value of option.value) {
          if (!acc.includes(value)) {
            acc.push(value)
          }
        }
        return acc
      }, [])
    }
  } else if (attribute.operator === 'between') {
    // TODO: Chech if this exceptions is needed
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
