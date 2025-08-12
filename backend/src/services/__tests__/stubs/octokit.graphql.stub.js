const base = () => Promise.resolve({})
base.defaults = () => base

module.exports = { graphql: base }
