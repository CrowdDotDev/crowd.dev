export default ({
  customFilters = {},
  defaultFilters = [],
  defaultRootFilters = [],
  buildFilter = false
}) => {
  let customAttributes = !buildFilter
    ? customFilters || {}
    : {}

  // Parse filters into API format
  if (buildFilter && Object.keys(customFilters).length) {
    const hasAttributes = Object.keys(
      customFilters.attributes
    ).length

    if (!hasAttributes) {
      customAttributes = {}
    } else {
      // Separate hidden from visible attributes
      // Distinguished by show property
      let hiddenAttributes = []
      let visibleAttributes = Object.values(
        customFilters.attributes
      ).reduce((acc, item) => {
        const attribute = _buildAttributeBlock(item)

        if (
          Array.isArray(item.value)
            ? item.value.length > 0
            : item.value !== '' &&
              item.value !== null &&
              item.value !== {}
        ) {
          if (item.show === false) {
            hiddenAttributes.push(attribute)
          } else {
            acc.push(attribute)
          }
        }

        return acc
      }, [])

      // Hidden properties should always be inside an AND operator
      // so that are always taken into account
      // Visible attributes should be inside the operator defined in the UI
      if (hiddenAttributes.length) {
        customAttributes = {
          and: [
            ...hiddenAttributes,
            {
              ...(visibleAttributes.length && {
                [customFilters.operator]: visibleAttributes
              })
            }
          ]
        }
      } else if (visibleAttributes.length) {
        customAttributes = {
          [customFilters.operator]: visibleAttributes
        }
      }
    }
  }

  let payload = customAttributes

  // Default filters should always be inside an AND operator
  // so that they are always taken into account
  // All other filters should handle their operators on their own
  if (defaultFilters.length) {
    payload = {
      and: [
        ...buildDefaultAttributeBlock({
          customFilters,
          defaultFilters
        }),
        customAttributes
      ]
    }
  }

  // Default root filters can be added diretly in the filter payload
  // without being inside an operator
  if (defaultRootFilters.length) {
    Object.assign(payload, ...defaultRootFilters)
  }

  return payload
}

// Only add as default filter if custom filters do not have the same attribute as well
// Scenarios where default filters are overriden by the same filter in the UI
const buildDefaultAttributeBlock = ({
  customFilters,
  defaultFilters
}) => {
  const filters = JSON.stringify(customFilters || {})

  return defaultFilters.filter((filter) => {
    const defaultName = Object.keys(filter)[0]

    return !filters.includes(defaultName)
  })
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
    return attribute.value.reduce(
      (obj, a) => {
        obj.or.push({
          sentiment: a.range
        })

        return obj
      },
      { or: [] }
    )
  } else if (attribute.name === 'averageSentiment') {
    return attribute.value.reduce(
      (obj, a) => {
        obj.or.push({
          averageSentiment: a.range
        })

        return obj
      },
      { or: [] }
    )
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
  } else if (attribute.name === 'activityTypes') {
    return {
      activityTypes: {
        overlap: [
          `${attribute.value.key}:${attribute.value.value}`
        ]
      }
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
  } else if (attribute.name === 'keywords') {
    // Eagle eye query
    const keywords = attribute.value.filter((k) => {
      return k[0] !== '"' && k[k.length - 1] !== '"'
    })
    const exactKeywords = attribute.value
      .filter((k) => {
        return k[0] === '"' && k[k.length - 1] === '"'
      })
      .map((k) => {
        return k.replace('"', '').replace('"', '')
      })

    const query = {}

    if (keywords.length > 0) {
      query.keywords = { overlap: keywords }
    }

    if (exactKeywords.length > 0) {
      query.exactKeywords = { overlap: exactKeywords }
    }
    return query
  } else if (attribute.name === 'activeOn') {
    rule = {
      contains: attribute.value.reduce((acc, option) => {
        acc.push(option.value)

        return acc
      }, [])
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
    const bottomLimit = attribute.value[0]
    const topLimit = attribute.value[1]

    rule = {
      // Range from ... to
      ...(!!(topLimit && bottomLimit) && {
        between: attribute.value
      }),
      // Range from ...
      ...(!!(bottomLimit && !topLimit) && {
        gte: bottomLimit
      }),
      // Range ... to
      ...(!!(!bottomLimit && topLimit) && {
        lte: topLimit
      })
    }
  } else if (attribute.operator === null) {
    rule = Array.isArray(attribute.value)
      ? attribute.value.map((o) => o.id || o.value)
      : attribute.value
  } else {
    rule = {
      [attribute.operator]: Array.isArray(attribute.value)
        ? attribute.value.map((o) => o.id || o.value || o)
        : attribute.value
    }
  }

  return {
    [attribute.custom
      ? `attributes.${attribute.name}.default`
      : attribute.name]: rule
  }
}
